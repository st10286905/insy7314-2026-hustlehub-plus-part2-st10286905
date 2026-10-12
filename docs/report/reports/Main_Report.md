**TEST KAN10-OPENVAS-001**

**Name:**  
Initial OpenVAS vulnerability scan

**Objective:**  
Identify network-level and SSL/TLS security vulnerabilities affecting the local HustleHub+ backend and establish a baseline for subsequent security remediation and rescanning.

**Method:**  
Automated vulnerability assessment performed using Greenbone OpenVAS against the local HustleHub+ backend.

The scan was performed using OpenVAS/Greenbone version 28.5.0.

**Endpoint:**  
Local HustleHub+ backend exposed through `172.20.0.1:3000/tcp` using SSL/TLS.

**Attack/Test:**  
An OpenVAS vulnerability scan was performed against the HustleHub+ environment.

The initial scan identified a total of 38 results:

- 0 Critical
- 0 High
- 2 Medium
- 1 Low
- 35 Log/Informational
- 0 False Positives

The primary Medium-severity findings related to the SSL/TLS certificate used by the local backend:

1. **SSL/TLS: Known Untrusted / Dangerous Certificate Authority (CA) Detection** — CVSS 5.0 (Medium)
2. **SSL/TLS: Certificate Signed Using a Weak Signature Algorithm** — CVSS 4.0 (Medium)

The scan also identified **TCP Timestamps Information Disclosure** with a CVSS score of 2.6 (Low).

The remaining results were primarily informational service and SSL/TLS detection results.

**Expected:**  
The OpenVAS scan should identify any known network-level vulnerabilities, SSL/TLS weaknesses, exposed services, and information-disclosure issues affecting the tested backend.

The scan should provide severity ratings that can be used to determine which findings require remediation.

**Actual:**  
The OpenVAS scan completed successfully and produced one vulnerability report with an overall maximum severity of **Medium (5.0)**.

No Critical or High-severity vulnerabilities were identified.

Two Medium-severity SSL/TLS findings were identified.

The first Medium finding reported that the backend was using a certificate issued by an untrusted or dangerous certificate authority. The detected certificate had:

- Subject: `CN=localhost`
- Issuer: `CN=localhost`
- Public key: RSA 2048-bit
- SAN: `localhost`
- Validity: 9 October 2026 to 9 October 2027

OpenVAS identified this as a potential risk because an untrusted certificate authority can allow an attacker to perform a man-in-the-middle attack if the certificate is trusted incorrectly.

The second Medium finding reported that the certificate used the weak `SHA-1` signature algorithm (`sha1WithRSAEncryption`).

The Low-severity finding reported that TCP timestamps were enabled on the host, potentially allowing an attacker to estimate system uptime.

OpenVAS also confirmed that the service on port `3000/tcp` was operating over SSL/TLS and that the tested SSL/TLS service supported **TLS 1.3**.

**Result:**  
PARTIAL PASS

The OpenVAS scan completed successfully and identified no Critical or High-severity vulnerabilities.

However, the scan identified two Medium-severity SSL/TLS certificate weaknesses and one Low-severity TCP timestamp information-disclosure finding.

These findings were recorded as the initial security baseline for subsequent remediation and verification.

**Evidence:**  
OpenVAS/Greenbone 28.5.0 report showing 38 total results consisting of 2 Medium, 1 Low, and 35 Log/Informational results, with 0 Critical and 0 High findings.

The identified Medium findings were `SSL/TLS: Known Untrusted / Dangerous Certificate Authority (CA) Detection` (CVSS 5.0) and `SSL/TLS: Certificate Signed Using a Weak Signature Algorithm` (CVSS 4.0).

The Low finding was `TCP Timestamps Information Disclosure` (CVSS 2.6).

OpenVAS also recorded TLS 1.3 support on the tested SSL/TLS service.
![alt text](reports/Attachments/INSY7312_PART1_openvas_report.png)
![alt text](reports/Attachments/INSY7312_PART1_openvas_report_results_1.png)
![alt text](reports/Attachments/INSY7312_PART1_openvas_report_results_2.png)
![alt text](reports/Attachments/INSY7312_PART1_openvas_report_results_3.png)
![alt text](reports/Attachments/INSY7312_PART1_openvas_report_results_4.png)
![alt text](reports/Attachments/INSY7312_PART1_openvas_report_results_5.png)
![alt text](reports/Attachments/INSY7312_PART1_openvas_report_results_6.png)
![alt text](reports/Attachments/INSY7312_PART1_openvas_report_results_7.png)
![alt text](reports/Attachments/INSY7312_PART1_openvas_report_results_8.png)
![alt text](reports/Attachments/INSY7312_PART1_openvas_report_results_9.png)

**Solution:**
had `init.js` install a sha256 certificate instead of sha1

--- 