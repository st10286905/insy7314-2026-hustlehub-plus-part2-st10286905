# Part 1 - Secure Foundations TODO List

## Requirements & Mark Allocations

### 1. Documentation & Architecture (20 Marks)
- [ ] **Architecture Diagram**
    - [ ] Outline components of the overall system.
    - [ ] Include security features and system boundaries.
    - [ ] Must reflect the MERN architecture.
- [ ] **README.md Documentation**
    - [ ] Clear explanation of the system.
    - [ ] Description of intended users.
    - [ ] Structure of the backend.
    - [ ] Detailed explanation of security decisions (hashing, JWT, validation, HTTPS).

### 2. API Functionality: Register/Login (20 Marks)
- [x] **Backend API Implementation**
    - [x] Implement using Node.js and Express.
    - [x] Support user registration functionality.
    - [x] Support user login functionality.
    - [x] User data storage (initial: in-memory or file-based).

### 3. API Functionality: Password Security & JWT (20 Marks)
- [x] **Security Implementation - Auth**
    - [x] **Password Hashing**: Ensure passwords are never stored in plain text.
    - [x] **JWT Authentication**:
        - [x] Generate JWT upon login.
        - [x] Protect API routes using JWT.
        - [x] Validate JWT on each protected request.

### 4. HTTPS Implementation (10 Marks)
- [ ] **Security Implementation - Transport**
    - [ ] Serve the application over HTTPS using a locally configured SSL certificate.

### 5. Input Validation & Error Handling (10 Marks)
- [ ] **Security Implementation - Safety**
    - [ ] **Input Validation**: Validate all user input before processing.
    - [ ] **Secure Error Handling**: Ensure error responses do not expose internal details (stack traces, paths, etc.).

### 6. Code Structure (10 Marks)
- [ ] **Project Organization**
    - [ ] Maintain a clean, modular architecture (separate routes, controllers, models).
    - [ ] Consistent naming and reusable components.

### 7. Postman Testing (10 Marks)
- [ ] **Testing & Demonstration**
    - [ ] **Postman Collection**:
        - [ ] Demonstrate successful registration.
        - [ ] Demonstrate successful login.
        - [ ] Demonstrate handling of invalid scenarios.
    - [ ] **Demonstration Video**:
        - [ ] Show API running.
        - [ ] Show successful registration.
        - [ ] Show login with token generation.

## Potential Deductions
- [ ] Incorrect GitHub used or not GitHub Used (-5 Marks)
- [ ] README.md file included but not formatted in Markdown (-5 Marks)

## Submission Deliverables
- [ ] GitHub repository link
- [ ] README containing all required documentation
- [ ] Postman collection
- [ ] Screenshots of API responses
- [ ] Demonstration video link
