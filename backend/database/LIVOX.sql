CREATE DATABASE IF NOT EXISTS livox;

USE livox;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE medical_profile (
    id INT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(50) NOT NULL,
    dob date NOT NULL,
    bloodgroup VARCHAR(20) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(255) NOT NULL,
    Allergies VARCHAR(100),
    Existing_conditions VARCHAR(100),
    Current_medications VARCHAR(100),
    user_id INT UNIQUE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
    
