import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

type PrivacyPolicyScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PrivacyPolicy'
>;

interface Props {
  navigation: PrivacyPolicyScreenNavigationProp;
}

const PrivacyPolicyScreen: React.FC<Props> = ({ navigation }) => {
  const handleContactEmail = () => {
    Linking.openURL('mailto:profsaleug@gmail.com');
  };

  const handleContactPhone = () => {
    Linking.openURL('tel:+256771362017');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last updated: May 2026</Text>
      </View>

      <View style={styles.content}>
        <Section title="1. Introduction">
          <Text style={styles.text}>
            ProfSale ("we," "us," "our," or "Company") is committed to
            protecting your privacy. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use
            our mobile and web applications.
          </Text>
          <Text style={styles.text}>
            Please read this Privacy Policy carefully. If you do not agree with
            our policies and practices, please do not use our Service.
          </Text>
        </Section>

        <Section title="2. Information We Collect">
          <SubSection title="2.1 Information You Provide Directly">
            <BulletPoint text="Account Information: Name, email address, phone number, business details, and password" />
            <BulletPoint text="Business Information: Business name, address, tax identification number" />
            <BulletPoint text="Customer Information: Names, phone numbers, email addresses, and purchase history" />
            <BulletPoint text="Product Information: Product names, descriptions, prices, and inventory details" />
            <BulletPoint text="Transaction Data: Sales records, payment information, and transaction history" />
            <BulletPoint text="Communication Data: Messages, feedback, and support requests" />
          </SubSection>

          <SubSection title="2.2 Information Collected Automatically">
            <BulletPoint text="Device Information: Device type, operating system, unique device identifiers" />
            <BulletPoint text="Usage Information: Pages visited, features used, time spent on the Service" />
            <BulletPoint text="Location Information: General location data based on IP address" />
            <BulletPoint text="Log Data: Server logs containing IP addresses, browser type, access times" />
            <BulletPoint text="Cookies and Tracking: We use similar technologies to track user activity" />
          </SubSection>
        </Section>

        <Section title="3. How We Use Your Information">
          <Text style={styles.text}>
            We use the information we collect for the following purposes:
          </Text>
          <BulletPoint text="To provide, maintain, and improve the Service" />
          <BulletPoint text="To process transactions and send related information" />
          <BulletPoint text="To send technical notices and support messages" />
          <BulletPoint text="To respond to your inquiries and provide customer support" />
          <BulletPoint text="To monitor and analyze trends, usage, and activities" />
          <BulletPoint text="To detect, prevent, and address fraud and security issues" />
          <BulletPoint text="To comply with legal obligations" />
          <BulletPoint text="To personalize and improve your experience" />
        </Section>

        <Section title="4. Data Security">
          <Text style={styles.text}>
            We implement comprehensive security measures to protect your
            personal information, including:
          </Text>
          <BulletPoint text="SSL/TLS encryption for data in transit" />
          <BulletPoint text="Encrypted storage for sensitive data at rest" />
          <BulletPoint text="Regular security audits and vulnerability assessments" />
          <BulletPoint text="Access controls and authentication mechanisms" />
          <BulletPoint text="Employee training on data protection" />
          <BulletPoint text="Incident response procedures" />
          <Text style={styles.text}>
            However, no method of transmission is 100% secure. We strive to use
            commercially acceptable means to protect your information.
          </Text>
        </Section>

        <Section title="5. Data Retention">
          <Text style={styles.text}>
            We retain your personal information for as long as necessary to
            provide the Service:
          </Text>
          <BulletPoint text="Account Information: While your account is active and thereafter" />
          <BulletPoint text="Transaction Data: For accounting and tax compliance (typically 7 years)" />
          <BulletPoint text="Customer Data: As long as necessary for business purposes" />
          <BulletPoint text="Log Data: Typically retained for 90 days" />
        </Section>

        <Section title="6. Sharing of Information">
          <Text style={styles.text}>
            We do not sell, trade, or rent your personal information to third
            parties. However, we may share your information:
          </Text>
          <BulletPoint text="With Service Providers: Vendors who assist us in operating the Service" />
          <BulletPoint text="Legal Requirements: When required by law or court order" />
          <BulletPoint text="Business Transfers: In connection with merger or acquisition" />
          <BulletPoint text="With Consent: With your explicit consent for specific purposes" />
          <BulletPoint text="Aggregated Data: We may share anonymized, aggregated data" />
        </Section>

        <Section title="7. Your Rights and Choices">
          <Text style={styles.text}>
            Depending on your location, you may have the following rights:
          </Text>
          <BulletPoint text="Access: Request access to your personal information" />
          <BulletPoint text="Correction: Request correction of inaccurate data" />
          <BulletPoint text="Deletion: Request deletion of your personal information" />
          <BulletPoint text="Portability: Request a copy of your data in a portable format" />
          <BulletPoint text="Opt-out: Opt out of marketing communications" />
          <BulletPoint text="Withdraw Consent: Withdraw consent for data processing" />
          <Text style={styles.text}>
            To exercise any of these rights, please contact us at
            profsaleug@gmail.com.
          </Text>
        </Section>

        <Section title="8. Cookies and Tracking Technologies">
          <Text style={styles.text}>
            We use cookies and similar tracking technologies to:
          </Text>
          <BulletPoint text="Remember your preferences and login information" />
          <BulletPoint text="Understand how you use the Service" />
          <BulletPoint text="Improve the Service and user experience" />
          <BulletPoint text="Detect and prevent fraud" />
        </Section>

        <Section title="9. Children's Privacy">
          <Text style={styles.text}>
            The Service is not intended for children under the age of 13. We do
            not knowingly collect personal information from children under 13.
            If we become aware that we have collected information from a child
            under 13, we will take steps to delete such information.
          </Text>
        </Section>

        <Section title="10. International Data Transfers">
          <Text style={styles.text}>
            Your information may be transferred to, stored in, and processed in
            countries other than your country of residence. By using the
            Service, you consent to the transfer of your information to
            countries outside your country of residence.
          </Text>
        </Section>

        <Section title="11. Changes to This Privacy Policy">
          <Text style={styles.text}>
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes by posting the new Privacy Policy and
            updating the "Last updated" date. Your continued use of the Service
            after such modifications constitutes your acceptance of the updated
            Privacy Policy.
          </Text>
        </Section>

        <Section title="12. Contact Us">
          <Text style={styles.text}>
            If you have questions about this Privacy Policy or our privacy
            practices, please contact us:
          </Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>ProfSale</Text>
            <TouchableOpacity onPress={handleContactEmail}>
              <Text style={styles.contactLink}>
                Email: profsaleug@gmail.com
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleContactPhone}>
              <Text style={styles.contactLink}>Phone: +256771362017</Text>
            </TouchableOpacity>
            <Text style={styles.contactText}>Location: Kampala, Uganda</Text>
          </View>
        </Section>

        <Section title="13. Compliance">
          <Text style={styles.text}>
            We comply with applicable data protection regulations, including:
          </Text>
          <BulletPoint text="Uganda Data Protection and Privacy Act" />
          <BulletPoint text="General Data Protection Regulation (GDPR) for EU users" />
          <BulletPoint text="California Consumer Privacy Act (CCPA) for California residents" />
          <BulletPoint text="Other applicable local and international privacy laws" />
        </Section>
      </View>
    </ScrollView>
  );
};

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

interface SubSectionProps {
  title: string;
  children: React.ReactNode;
}

const SubSection: React.FC<SubSectionProps> = ({ title, children }) => (
  <View style={styles.subsection}>
    <Text style={styles.subsectionTitle}>{title}</Text>
    {children}
  </View>
);

interface BulletPointProps {
  text: string;
}

const BulletPoint: React.FC<BulletPointProps> = ({ text }) => (
  <View style={styles.bulletPoint}>
    <Text style={styles.bullet}>•</Text>
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  lastUpdated: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  content: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
  },
  subsection: {
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  subsectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  text: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: SPACING.sm,
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  bullet: {
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    marginRight: SPACING.xs,
    fontWeight: '700',
  },
  bulletText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    lineHeight: 18,
    flex: 1,
  },
  contactInfo: {
    backgroundColor: COLORS.surface,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    padding: SPACING.md,
    borderRadius: 4,
    marginTop: SPACING.sm,
  },
  contactLabel: {
    fontSize: TYPOGRAPHY.fontSize.base,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  contactLink: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  contactText: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
});

export default PrivacyPolicyScreen;
