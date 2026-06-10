-- Δημιουργία της Βάσης Δεδομένων
CREATE DATABASE IF NOT EXISTS releaf_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE releaf_db;

-- Διαγραφή παλιών πινάκων αν υπάρχουν (με τη σωστή σειρά λόγω Foreign Keys)
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS action_proposals;
DROP TABLE IF EXISTS environmental_needs;
DROP TABLE IF EXISTS receipts;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS donations;
DROP TABLE IF EXISTS fundraising_campaigns;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS participation_requests;
DROP TABLE IF EXISTS environmental_actions;
DROP TABLE IF EXISTS organisations;
DROP TABLE IF EXISTS action_types;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS volunteer_profiles;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS users;

-- ==========================================
-- CORE USERS & PROFILES
-- ==========================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    account_type ENUM('volunteer', 'organisation', 'sponsor') DEFAULT 'volunteer',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE volunteer_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profile_id INT NOT NULL,
    skills TEXT,
    resources TEXT,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- ==========================================
-- ACTIONS & ORGANISATIONS
-- ==========================================
CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE action_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE
);

CREATE TABLE organisations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE environmental_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    max_participants INT DEFAULT 0,
    location_id INT NOT NULL,
    action_type_id INT NOT NULL,
    organisation_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE,
    FOREIGN KEY (action_type_id) REFERENCES action_types(id) ON DELETE CASCADE,
    FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE CASCADE
);

CREATE TABLE participation_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (action_id) REFERENCES environmental_actions(id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- FUNDRAISING & DONATIONS
-- ==========================================
CREATE TABLE fundraising_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    goal_amount INT NOT NULL,
    current_amount INT DEFAULT 0,
    action_id INT NOT NULL,
    creator_user_id INT NOT NULL,
    FOREIGN KEY (action_id) REFERENCES environmental_actions(id) ON DELETE CASCADE,
    FOREIGN KEY (creator_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sponsor_id INT NOT NULL,
    campaign_id INT NOT NULL,
    amount INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sponsor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES fundraising_campaigns(id) ON DELETE CASCADE
);

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

CREATE TABLE receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donation_id INT NOT NULL,
    receipt_number VARCHAR(100) NOT NULL UNIQUE,
    FOREIGN KEY (donation_id) REFERENCES donations(id) ON DELETE CASCADE
);

-- ==========================================
-- NEEDS, PROPOSALS & CERTIFICATES
-- ==========================================
CREATE TABLE environmental_needs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    location_id INT NOT NULL,
    description TEXT NOT NULL,
    severity ENUM('low', 'medium', 'high') DEFAULT 'high',
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
);

CREATE TABLE action_proposals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    need_id INT NOT NULL,
    action_type_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('proposed', 'converted_to_action') DEFAULT 'proposed',
    FOREIGN KEY (need_id) REFERENCES environmental_needs(id) ON DELETE CASCADE,
    FOREIGN KEY (action_type_id) REFERENCES action_types(id) ON DELETE CASCADE
);

CREATE TABLE certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    action_id INT NOT NULL,
    issue_date VARCHAR(50) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (action_id) REFERENCES environmental_actions(id) ON DELETE CASCADE
);

-- ==========================================
-- ΑΡΧΙΚΑ ΔΕΔΟΜΕΝΑ (SEED DATA)
-- ==========================================
INSERT INTO action_types (name) VALUES 
('Δενδροφύτευση'), ('Καθαρισμός Παραλίας'), ('Καθαρισμός Δάσους'), 
('Ανακύκλωση / Κυκλική Οικονομία'), ('Προστασία Πανίδας'), 
('Πυροπροστασία / Δασοπροστασία'), ('Διάσωση & Περίθαλψη Ζώων'), 
('Περιβαλλοντική Εκπαίδευση'), ('Φροντίδα Αστικού Πρασίνου'), ('Αποκατάσταση Τοπίου');