--File included as a reference for the input into the database

DROP DATABASE IF EXISTS employees;
CREATE DATABASE employees;
USE employees;
CREATE TABLE department (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL
);
CREATE TABLE role (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(30) UNIQUE NOT NULL,
    salary DECIMAL UNSIGNED NOT NULL,
    department_id INT UNSIGNED NOT NULL,
    INDEX dep_ind (department_id),
    CONSTRAINT fk_department FOREIGN KEY (department_id) REFERENCES department(id) ON DELETE CASCADE
);
CREATE TABLE employee (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(30) NOT NULL,
    last_name VARCHAR(30) NOT NULL,
    role_id INT UNSIGNED NOT NULL,
    INDEX role_ind (role_id),
    CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
    manager_id INT UNSIGNED,
    INDEX man_ind (manager_id),
    CONSTRAINT fk_manager FOREIGN KEY (manager_id) REFERENCES employee(id) ON DELETE SET NULL
);
USE employees;
INSERT INTO department
    (name)
VALUES
    ('Operations'),
    ('Analytics'),
    ('Marketing'),
    ('Executive');
INSERT INTO role
    (title, salary, department_id)
VALUES
    ('General Manager', 100000, 1),
    ('Coach', 90000, 1),
    ('Team Lead Analyst', 95000, 2),
    ('Team Analyst', 90000, 2),
    ('Media Manager', 85000, 3),
    ('Media Specialist', 80000, 3),
    ('CEO', 1000000, 4),
    ('Executive Assistant', 500000, 4);
INSERT INTO employee
    (first_name, last_name, role_id, manager_id)
VALUES
    ('Shaun', 'Reed', 1, NULL),
    ('Mae', 'Mitchell', 2, 1),
    ('Abbie', 'Smith', 3, NULL),
    ('Blake', 'Fisher', 4, 3),
    ('Molly', 'Price', 5, NULL),
    ('Jack', 'Hudson', 6, 5),
    ('Pinch', 'Reyes', 7, NULL),
    ('Loren', 'Bailey', 8, 7);