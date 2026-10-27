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

CREATE TABLE medical_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) DEFAULT 'Lab result',
    file_size INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE emergency_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- User preferences for notification and emergency sharing controls.
CREATE TABLE IF NOT EXISTS user_settings (
    user_id INT PRIMARY KEY,
    health_notifications BOOLEAN NOT NULL DEFAULT TRUE,
    emergency_qr_sharing BOOLEAN NOT NULL DEFAULT FALSE,
    monthly_review_reminder BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Donor listings are visible only when the donor explicitly consents.
CREATE TABLE IF NOT EXISTS blood_donors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    blood_group VARCHAR(10) NOT NULL,
    city VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    consent BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_donor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Opaque token is embedded in the public emergency QR URL, not a numeric user ID.
CREATE TABLE IF NOT EXISTS emergency_qr_tokens (
    user_id INT PRIMARY KEY,
    public_token CHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_qr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
