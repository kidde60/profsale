import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PrivacyPolicy.css';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="privacy-policy-container">
      <div className="privacy-policy-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Privacy Policy</h1>
        <p className="last-updated">Last updated: May 2026</p>
      </div>

      <div className="privacy-policy-content">
        <section>
          <h2>1. Introduction</h2>
          <p>
            ProfSale ("we," "us," "our," or "Company") is committed to
            protecting your privacy. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use
            our web and mobile applications, including any other media form,
            media channel, mobile website, or mobile application related or
            connected thereto (collectively, the "Service").
          </p>
          <p>
            Please read this Privacy Policy carefully. If you do not agree with
            our policies and practices, please do not use our Service.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>

          <h3>2.1 Information You Provide Directly</h3>
          <ul>
            <li>
              <strong>Account Information:</strong> Name, email address, phone
              number, business details, and password when you create an account
            </li>
            <li>
              <strong>Business Information:</strong> Business name, address, tax
              identification number, and other business-related details
            </li>
            <li>
              <strong>Customer Information:</strong> Names, phone numbers, email
              addresses, and purchase history of your customers
            </li>
            <li>
              <strong>Product Information:</strong> Product names, descriptions,
              prices, and inventory details
            </li>
            <li>
              <strong>Transaction Data:</strong> Sales records, payment
              information, and transaction history
            </li>
            <li>
              <strong>Communication Data:</strong> Messages, feedback, and
              support requests you send to us
            </li>
          </ul>

          <h3>2.2 Information Collected Automatically</h3>
          <ul>
            <li>
              <strong>Device Information:</strong> Device type, operating
              system, unique device identifiers, and mobile network information
            </li>
            <li>
              <strong>Usage Information:</strong> Pages visited, features used,
              time spent on the Service, and interaction patterns
            </li>
            <li>
              <strong>Location Information:</strong> General location data based
              on IP address (not precise GPS location)
            </li>
            <li>
              <strong>Log Data:</strong> Server logs containing IP addresses,
              browser type, access times, and referring URLs
            </li>
            <li>
              <strong>Cookies and Tracking Technologies:</strong> We use
              cookies, web beacons, and similar technologies to track user
              activity and preferences
            </li>
          </ul>

          <h3>2.3 Information from Third Parties</h3>
          <ul>
            <li>
              Payment processors and financial institutions for transaction
              processing
            </li>
            <li>Analytics providers for usage statistics</li>
            <li>Cloud service providers for data storage and processing</li>
          </ul>
        </section>

        <section>
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li>To provide, maintain, and improve the Service</li>
            <li>To process transactions and send related information</li>
            <li>To send technical notices and support messages</li>
            <li>To respond to your inquiries and provide customer support</li>
            <li>To monitor and analyze trends, usage, and activities</li>
            <li>To detect, prevent, and address fraud and security issues</li>
            <li>
              To comply with legal obligations and enforce our Terms of Service
            </li>
            <li>To send promotional communications (with your consent)</li>
            <li>To personalize and improve your experience</li>
            <li>To conduct research and analytics</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Security</h2>
          <p>
            We implement comprehensive security measures to protect your
            personal information, including:
          </p>
          <ul>
            <li>SSL/TLS encryption for data in transit</li>
            <li>Encrypted storage for sensitive data at rest</li>
            <li>Regular security audits and vulnerability assessments</li>
            <li>Access controls and authentication mechanisms</li>
            <li>Employee training on data protection and privacy</li>
            <li>Incident response procedures</li>
          </ul>
          <p>
            However, no method of transmission over the Internet or electronic
            storage is 100% secure. While we strive to use commercially
            acceptable means to protect your personal information, we cannot
            guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>5. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to
            provide the Service and fulfill the purposes outlined in this
            Privacy Policy. Retention periods vary depending on the type of
            information and the purposes for which we use it:
          </p>
          <ul>
            <li>
              <strong>Account Information:</strong> Retained while your account
              is active and for a reasonable period thereafter
            </li>
            <li>
              <strong>Transaction Data:</strong> Retained for accounting, tax,
              and legal compliance purposes (typically 7 years)
            </li>
            <li>
              <strong>Customer Data:</strong> Retained as long as necessary for
              business purposes
            </li>
            <li>
              <strong>Log Data:</strong> Typically retained for 90 days
            </li>
          </ul>
          <p>
            You may request deletion of your data at any time, subject to legal
            and contractual obligations.
          </p>
        </section>

        <section>
          <h2>6. Sharing of Information</h2>
          <p>
            We do not sell, trade, or rent your personal information to third
            parties. However, we may share your information in the following
            circumstances:
          </p>
          <ul>
            <li>
              <strong>Service Providers:</strong> With vendors who assist us in
              operating the Service (payment processors, hosting providers,
              analytics services)
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law, court
              order, or government request
            </li>
            <li>
              <strong>Business Transfers:</strong> In connection with a merger,
              acquisition, or sale of assets
            </li>
            <li>
              <strong>Consent:</strong> With your explicit consent for specific
              purposes
            </li>
            <li>
              <strong>Aggregated Data:</strong> We may share anonymized,
              aggregated data that cannot identify you
            </li>
          </ul>
        </section>

        <section>
          <h2>7. Your Rights and Choices</h2>
          <p>Depending on your location, you may have the following rights:</p>
          <ul>
            <li>
              <strong>Access:</strong> Request access to your personal
              information
            </li>
            <li>
              <strong>Correction:</strong> Request correction of inaccurate data
            </li>
            <li>
              <strong>Deletion:</strong> Request deletion of your personal
              information
            </li>
            <li>
              <strong>Portability:</strong> Request a copy of your data in a
              portable format
            </li>
            <li>
              <strong>Opt-out:</strong> Opt out of marketing communications and
              certain data uses
            </li>
            <li>
              <strong>Withdraw Consent:</strong> Withdraw consent for data
              processing
            </li>
          </ul>
          <p>
            To exercise any of these rights, please contact us at
            privacy@profsale.com.
          </p>
        </section>

        <section>
          <h2>8. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar tracking technologies to:</p>
          <ul>
            <li>Remember your preferences and login information</li>
            <li>Understand how you use the Service</li>
            <li>Improve the Service and user experience</li>
            <li>Detect and prevent fraud</li>
          </ul>
          <p>
            You can control cookies through your browser settings. However,
            disabling cookies may affect the functionality of the Service.
          </p>
        </section>

        <section>
          <h2>9. Third-Party Links</h2>
          <p>
            The Service may contain links to third-party websites and services
            that are not operated by us. This Privacy Policy does not apply to
            third-party services, and we are not responsible for their privacy
            practices. We encourage you to review the privacy policies of any
            third-party services before providing your information.
          </p>
        </section>

        <section>
          <h2>10. Children's Privacy</h2>
          <p>
            The Service is not intended for children under the age of 13. We do
            not knowingly collect personal information from children under 13.
            If we become aware that we have collected information from a child
            under 13, we will take steps to delete such information and
            terminate the child's account.
          </p>
        </section>

        <section>
          <h2>11. International Data Transfers</h2>
          <p>
            Your information may be transferred to, stored in, and processed in
            countries other than your country of residence. These countries may
            have data protection laws that differ from your home country. By
            using the Service, you consent to the transfer of your information
            to countries outside your country of residence. All data transfers
            comply with Uganda Data Protection and Privacy Act requirements.
          </p>
        </section>

        <section>
          <h2>12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect
            changes in our practices, technology, legal requirements, or other
            factors. We will notify you of any material changes by posting the
            new Privacy Policy on the Service and updating the "Last updated"
            date. Your continued use of the Service after such modifications
            constitutes your acceptance of the updated Privacy Policy.
          </p>
        </section>

        <section>
          <h2>13. Contact Us & Data Deletion Requests</h2>
          <p>
            If you have questions about this Privacy Policy or our privacy
            practices, please contact us using the information below:
          </p>
          <div className="contact-info">
            <p>
              <strong>ProfSale</strong>
            </p>
            <p>Email: profsaleug@gmail.com</p>
            <p>Phone: +256771362017</p>
            <p>Address: Kampala, Uganda</p>
          </div>
          <p style={{ marginTop: '20px' }}>
            <strong>Request Account & Data Deletion:</strong>
          </p>
          <p>
            To request deletion of your account and all associated data, please
            email us at{' '}
            <a
              href="mailto:profsaleug@gmail.com?subject=Data%20Deletion%20Request"
              style={{ color: '#007bff', textDecoration: 'none' }}
            >
              profsaleug@gmail.com
            </a>{' '}
            with the subject line "Data Deletion Request" and include your
            account email address. We will process your request within 30 days
            in accordance with applicable data protection laws.
          </p>
        </section>

        <section>
          <h2>14. Compliance</h2>
          <p>
            We comply with applicable data protection regulations, including but
            not limited to:
          </p>
          <ul>
            <li>Uganda Data Protection and Privacy Act</li>
            <li>General Data Protection Regulation (GDPR) for EU users</li>
            <li>
              California Consumer Privacy Act (CCPA) for California residents
            </li>
            <li>Other applicable local and international privacy laws</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
