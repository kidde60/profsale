import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TermsOfService.css';

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="terms-container">
      <div className="terms-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Terms of Service</h1>
        <p className="last-updated">Last updated: May 2026</p>
      </div>

      <div className="terms-content">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using ProfSale ("Service"), you accept and agree to
            be bound by the terms and provision of this agreement. If you do not
            agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section>
          <h2>2. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the
            materials (information or software) on ProfSale for personal,
            non-commercial transitory viewing only. This is the grant of a
            license, not a transfer of title, and under this license you may
            not:
          </p>
          <ul>
            <li>Modifying or copying the materials</li>
            <li>
              Using the materials for any commercial purpose or for any public
              display
            </li>
            <li>
              Attempting to decompile or reverse engineer any software contained
              on the Service
            </li>
            <li>
              Removing any copyright or other proprietary notations from the
              materials
            </li>
            <li>
              Transferring the materials to another person or "mirroring" the
              materials on any other server
            </li>
            <li>Violating any applicable laws or regulations</li>
            <li>
              Engaging in any conduct that restricts or inhibits anyone's use or
              enjoyment of the Service
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Disclaimer</h2>
          <p>
            The materials on ProfSale are provided on an 'as is' basis. ProfSale
            makes no warranties, expressed or implied, and hereby disclaims and
            negates all other warranties including, without limitation, implied
            warranties or conditions of merchantability, fitness for a
            particular purpose, or non-infringement of intellectual property or
            other violation of rights.
          </p>
        </section>

        <section>
          <h2>4. Limitations</h2>
          <p>
            In no event shall ProfSale or its suppliers be liable for any
            damages (including, without limitation, damages for loss of data or
            profit, or due to business interruption) arising out of the use or
            inability to use the materials on ProfSale, even if ProfSale or an
            authorized representative has been notified orally or in writing of
            the possibility of such damage.
          </p>
        </section>

        <section>
          <h2>5. Accuracy of Materials</h2>
          <p>
            The materials appearing on ProfSale could include technical,
            typographical, or photographic errors. ProfSale does not warrant
            that any of the materials on the Service are accurate, complete, or
            current. ProfSale may make changes to the materials contained on the
            Service at any time without notice.
          </p>
        </section>

        <section>
          <h2>6. Materials and Content</h2>
          <p>
            ProfSale has not reviewed all of the sites linked to its website and
            is not responsible for the contents of any such linked site. The
            inclusion of any link does not imply endorsement by ProfSale of the
            site. Use of any such linked website is at the user's own risk.
          </p>
        </section>

        <section>
          <h2>7. Modifications</h2>
          <p>
            ProfSale may revise these terms of service for the Service at any
            time without notice. By using this Service, you are agreeing to be
            bound by the then current version of these terms of service.
          </p>
        </section>

        <section>
          <h2>8. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in
            accordance with the laws of Kenya, and you irrevocably submit to the
            exclusive jurisdiction of the courts in that location.
          </p>
        </section>

        <section>
          <h2>9. User Accounts</h2>
          <p>
            When you create an account on ProfSale, you are responsible for
            maintaining the confidentiality of your account information and
            password. You agree to accept responsibility for all activities that
            occur under your account. You must notify us immediately of any
            unauthorized use of your account.
          </p>
        </section>

        <section>
          <h2>10. User Conduct</h2>
          <p>
            You agree not to use the Service for any unlawful purpose or in any
            way that could damage, disable, or impair the Service. Prohibited
            behavior includes:
          </p>
          <ul>
            <li>
              Harassing or causing distress or inconvenience to any person
            </li>
            <li>Obscene or abusive language or content</li>
            <li>Disrupting the normal flow of dialogue within the Service</li>
            <li>Attempting to gain unauthorized access to the Service</li>
            <li>Transmitting obscene or offensive content</li>
            <li>Disrupting the normal flow of dialogue within the Service</li>
          </ul>
        </section>

        <section>
          <h2>11. Intellectual Property Rights</h2>
          <p>
            All content included on the Service, such as text, graphics, logos,
            images, audio clips, digital downloads, and data compilations, is
            the property of ProfSale or its content suppliers and protected by
            international copyright laws.
          </p>
        </section>

        <section>
          <h2>12. Payment Terms</h2>
          <p>
            If you use the paid features of ProfSale, you agree to pay all
            charges and fees that you incur. ProfSale reserves the right to
            change its fees at any time with notice. Refunds are subject to our
            refund policy.
          </p>
        </section>

        <section>
          <h2>13. Limitation of Liability</h2>
          <p>
            In no event shall ProfSale, its directors, employees, or agents be
            liable to you for any indirect, incidental, special, consequential,
            or punitive damages resulting from your use of or inability to use
            the Service.
          </p>
        </section>

        <section>
          <h2>14. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless ProfSale, its directors,
            employees, and agents from and against any and all claims, damages,
            losses, costs, and expenses (including reasonable attorney's fees)
            arising from your use of the Service or violation of these Terms of
            Service.
          </p>
        </section>

        <section>
          <h2>15. Termination</h2>
          <p>
            ProfSale may terminate or suspend your account and access to the
            Service immediately, without prior notice or liability, for any
            reason whatsoever, including if you breach the Terms of Service.
          </p>
        </section>

        <section>
          <h2>16. Entire Agreement</h2>
          <p>
            These Terms of Service constitute the entire agreement between you
            and ProfSale regarding the use of the Service and supersede all
            prior negotiations, representations, or agreements, whether written
            or oral.
          </p>
        </section>

        <section>
          <h2>17. Contact Information</h2>
          <p>
            If you have any questions about these Terms of Service, please
            contact us using the information below:
          </p>
          <div className="contact-info">
            <p>
              <strong>ProfSale</strong>
            </p>
            <p>Email: profsaleug@gmail.com</p>
            <p>Phone: +256771362017</p>
            <p>Address: Kampala, Uganda</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
