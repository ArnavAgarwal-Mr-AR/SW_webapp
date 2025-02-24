from modal import Image, Stub, method, web_endpoint, Secret
from modal.cls import ClusterConfig
import os
import json
from typing import Dict, Optional

# Create Modal stub
stub = Stub("podcast-ai")

# Define container image with ML dependencies
image = (
    Image.debian_slim()
    .pip_install(
        "torch",
        "transformers>=4.34.0",
        "accelerate>=0.24.0",
        "sentencepiece",
        "protobuf",
        "optimum",
        "auto-gptq",
    )
)

# Model IDs
WHISPER_MODEL = "openai/whisper-large-v3"
LLM_MODEL = "meta-llama/Llama-2-7b-chat-hf"
TTS_MODEL = "facebook/fastspeech2-en-ljspeech"

@stub.cls(
    image=image,
    gpu=ClusterConfig(
        instance_type="A10G",
        memory=20,
    ),
    secrets=[Secret.from_name("huggingface")],
)
class PodcastAI:
    def __enter__(self):
        import torch
        from transformers import (
            WhisperProcessor, WhisperForConditionalGeneration,
            AutoTokenizer, AutoModelForCausalLM,
            SpeechT5Processor, SpeechT5ForTextToSpeech,
            pipeline
        )

        # Initialize Whisper for STT
        self.stt_processor = WhisperProcessor.from_pretrained(WHISPER_MODEL)
        self.stt_model = WhisperForConditionalGeneration.from_pretrained(
            WHISPER_MODEL,
            torch_dtype=torch.float16,
            device_map="auto",
        )

        # Initialize LLaMA for chat
        self.llm_tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL)
        self.llm_model = AutoModelForCausalLM.from_pretrained(
            LLM_MODEL,
            torch_dtype=torch.float16,
            device_map="auto",
        )

        # Initialize TTS
        self.tts_processor = SpeechT5Processor.from_pretrained(TTS_MODEL)
        self.tts_model = SpeechT5ForTextToSpeech.from_pretrained(TTS_MODEL)
        
        # Set device
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    @method()
    def transcribe(self, audio_bytes: bytes, language: str) -> Dict:
        import torch
        import numpy as np
        
        # Convert audio bytes to numpy array
        audio_array = np.frombuffer(audio_bytes, dtype=np.float32)
        
        # Process audio
        input_features = self.stt_processor(
            audio_array,
            sampling_rate=16000,
            return_tensors="pt"
        ).input_features.to(self.device)

        # Generate transcription
        predicted_ids = self.stt_model.generate(
            input_features,
            language=language,
            task="transcribe"
        )
        
        transcription = self.stt_processor.batch_decode(
            predicted_ids,
            skip_special_tokens=True
        )[0]

        return {"text": transcription, "language": language}

    @method()
    def generate_response(self, text: str, language: str) -> Dict:
        # Prepare prompt
        prompt = f"""You are an AI podcast co-host. Respond naturally to: {text}
        Keep the response concise and engaging. Speak in {language}."""
        
        # Tokenize
        inputs = self.llm_tokenizer(prompt, return_tensors="pt").to(self.device)
        
        # Generate
        with torch.no_grad():
            outputs = self.llm_model.generate(
                **inputs,
                max_new_tokens=100,
                temperature=0.7,
                do_sample=True,
            )
        
        response = self.llm_tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        return {"response": response, "language": language}

    @method()
    def synthesize_speech(self, text: str, language: str) -> Dict:
        import torch
        
        # Process text
        inputs = self.tts_processor(text=text, return_tensors="pt")
        
        # Generate speech
        speech = self.tts_model.generate_speech(
            inputs["input_ids"],
            speaker_embeddings=None,
            vocoder=None
        )
        
        # Convert to bytes
        audio_bytes = speech.cpu().numpy().tobytes()
        
        return {
            "audio": audio_bytes,
            "sample_rate": 16000,
            "language": language
        }

    @web_endpoint(method="POST")
    async def process_audio(self, body: bytes) -> Dict:
        request_data = json.loads(body)
        audio = request_data.get("audio")
        language = request_data.get("language", "en")
        
        # Process audio through pipeline
        transcription = await self.transcribe.remote(audio, language)
        response = await self.generate_response.remote(transcription["text"], language)
        audio_response = await self.synthesize_speech.remote(response["response"], language)
        
        return {
            "transcription": transcription["text"],
            "response": response["response"],
            "audio": audio_response["audio"],
            "sample_rate": audio_response["sample_rate"],
            "language": language
        }