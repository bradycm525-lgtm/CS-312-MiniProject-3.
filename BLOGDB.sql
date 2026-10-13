CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE blogs (
    blog_id SERIAL PRIMARY KEY,
    creator_name VARCHAR(255) NOT NULL,
    creator_user_id VARCHAR(255) REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    category VARCHAR(100)
);

INSERT INTO users (user_id, password, name) VALUES 
('alice123', 'password123', 'Alice Smith'),
('bob456', 'password456', 'Bob Jones'),
('carol789', 'password789', 'Carol Danvers');

INSERT INTO blogs (creator_name, creator_user_id, title, body, category) VALUES 
('Alice Smith', 'alice123', 'Getting Started with Node.js', 'Node.js is an open-source, cross-platform JavaScript runtime environment.', 'Technology'),
('Bob Jones', 'bob456', 'Exploring PostgreSQL', 'PostgreSQL is a powerful, open-source object-relational database system.', 'Technology'),
('Carol Danvers', 'carol789', 'The Art of Lifestyle Design', 'Designing your lifestyle takes intentional planning and daily execution.', 'Lifestyle'),
('Alice Smith', 'alice123', 'Academic Research Tips', 'Effective literature reviews require organization and critical thinking.', 'Academic'),
('Bob Jones', 'bob456', 'General Thoughts on Coding', 'Always write clean, maintainable, and well-documented code.', 'General');