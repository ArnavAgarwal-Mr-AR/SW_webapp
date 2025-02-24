-- Connect to the database
\c pod1;

-- Check if the users table exists
\dt users;

-- Check if the test user exists
SELECT id, name, email, LEFT(password_hash, 20) as partial_hash 
FROM users 
WHERE email = 'arnavjig@gmail.com'; 