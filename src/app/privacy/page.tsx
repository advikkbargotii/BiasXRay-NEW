import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
                Privacy Policy
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Effective Date: December 29, 2024
              </p>
            </CardHeader>
            <CardContent className="prose prose-gray dark:prose-invert max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
                <p>
                  BiasXRay ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect information when you use our browser extension and website.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
                
                <h3 className="text-xl font-medium mb-3">Text Content:</h3>
                <ul className="list-disc pl-6 mb-4">
                  <li>We collect text content that you explicitly select or choose to analyze through our browser extension or website</li>
                  <li>This includes selected text from web pages and content you paste into our analysis tool</li>
                  <li>We do not automatically collect or scan web pages without your explicit action</li>
                </ul>

                <h3 className="text-xl font-medium mb-3">Technical Information:</h3>
                <ul className="list-disc pl-6">
                  <li>Server logs may temporarily record IP addresses for security and performance purposes</li>
                  <li>Basic browser information (User-Agent) for compatibility purposes</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Information We DO NOT Collect</h2>
                <ul className="list-disc pl-6">
                  <li>Personal identifying information (name, email, address, phone number)</li>
                  <li>Browsing history or web activity outside of your explicit analysis requests</li>
                  <li>Passwords, credentials, or authentication data</li>
                  <li>Location data or GPS coordinates</li>
                  <li>Financial or payment information</li>
                  <li>Health information</li>
                  <li>Personal communications (emails, messages, etc.)</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. How We Use Your Information</h2>
                <ul className="list-disc pl-6">
                  <li><strong>Text Analysis:</strong> To perform bias detection, hallucination analysis, and ideological skew assessment</li>
                  <li><strong>Service Improvement:</strong> To improve our analysis algorithms and user experience</li>
                  <li><strong>Security:</strong> To protect against abuse and ensure service reliability</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Data Storage and Retention</h2>
                <ul className="list-disc pl-6">
                  <li>Text submitted for analysis is processed temporarily and is not permanently stored</li>
                  <li>Server logs are retained for a limited time for security purposes only</li>
                  <li>We do not create user profiles or maintain databases of analyzed content</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">6. Data Sharing</h2>
                <ul className="list-disc pl-6">
                  <li>We do not sell, rent, or share your data with third parties</li>
                  <li>We do not use your data for advertising purposes</li>
                  <li>Data may only be disclosed if required by law or to protect our legal rights</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">7. Browser Extension Permissions</h2>
                <p className="mb-3">Our extension requests the following permissions:</p>
                <ul className="list-disc pl-6">
                  <li><strong>Active Tab:</strong> To analyze content on your current tab when you request it</li>
                  <li><strong>Storage:</strong> To save your preferences locally on your device</li>
                  <li><strong>Context Menus:</strong> To provide right-click analysis options</li>
                  <li><strong>Host Permissions:</strong> To display analysis results on any website</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">8. Data Security</h2>
                <ul className="list-disc pl-6">
                  <li>All data transmission uses HTTPS encryption</li>
                  <li>We implement industry-standard security measures</li>
                  <li>Access to systems is restricted and monitored</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">9. Your Rights</h2>
                <ul className="list-disc pl-6">
                  <li>You control what content is analyzed by our service</li>
                  <li>You can stop using our service at any time</li>
                  <li>All analysis is initiated by your explicit actions</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
                <p>
                  Our service is not intended for children under 13. We do not knowingly collect information from children under 13.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
                <p>
                  We may update this privacy policy. Changes will be posted on this page with an updated effective date.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
                <p>
                  If you have questions about this privacy policy, please contact us through our website or extension support channels.
                </p>
              </section>

              <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg mt-8">
                <p className="text-center text-gray-600 dark:text-gray-400">
                  <strong>Last Updated:</strong> December 29, 2024
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
