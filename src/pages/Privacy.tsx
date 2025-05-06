import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Separator } from "@/components/ui/separator";

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
            
            <p className="text-muted-foreground mb-8">
              Last Updated: October 10, 2023
            </p>
            
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="mb-6">
                SmartLearn, Inc. ("SmartLearn", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our platform, including any other media form, media channel, mobile website, or mobile application related or connected thereto (collectively, the "Site").
              </p>
              
              <p className="mb-8">
                Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Site.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">1. Collection of Your Information</h2>
              
              <p className="mb-6">
                We may collect information about you in a variety of ways. The information we may collect on the Site includes:
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Personal Data</h3>
              
              <p className="mb-6">
                Personally identifiable information, such as your name, email address, and telephone number, that you voluntarily give to us when you register with the Site or when you choose to participate in various activities related to the Site. You are under no obligation to provide us with personal information of any kind, however your refusal to do so may prevent you from using certain features of the Site.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Derivative Data</h3>
              
              <p className="mb-6">
                Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Financial Data</h3>
              
              <p className="mb-6">
                Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services from the Site. We store only very limited, if any, financial information that we collect. Otherwise, all financial information is stored by our payment processor and you are encouraged to review their privacy policy and contact them directly for responses to your questions.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Data From Social Networks</h3>
              
              <p className="mb-8">
                User information from social networking sites, such as Facebook, Google+, Instagram, Twitter, including your name, your social network username, location, gender, birth date, email address, profile picture, and public data for contacts, if you connect your account to such social networks.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">2. Use of Your Information</h2>
              
              <p className="mb-6">
                Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Site to:
              </p>
              
              <ul className="list-disc pl-6 mb-8">
                <li className="mb-2">Create and manage your account.</li>
                <li className="mb-2">Process payments and refunds.</li>
                <li className="mb-2">Email you regarding your account or order.</li>
                <li className="mb-2">Send you a newsletter.</li>
                <li className="mb-2">Enable user-to-user communications.</li>
                <li className="mb-2">Generate a personal profile about you to make future visits to the Site more personalized.</li>
                <li className="mb-2">Increase the efficiency and operation of the Site.</li>
                <li className="mb-2">Monitor and analyze usage and trends to improve your experience with the Site.</li>
                <li className="mb-2">Notify you of updates to the Site.</li>
                <li className="mb-2">Resolve disputes and troubleshoot problems.</li>
                <li>Respond to product and customer service requests.</li>
              </ul>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">3. Disclosure of Your Information</h2>
              
              <p className="mb-6">
                We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">By Law or to Protect Rights</h3>
              
              <p className="mb-6">
                If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Third-Party Service Providers</h3>
              
              <p className="mb-6">
                We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, hosting services, customer service, and marketing assistance.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Marketing Communications</h3>
              
              <p className="mb-8">
                With your consent, or with an opportunity for you to withdraw consent, we may share your information with third parties for marketing purposes, as permitted by law.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">4. Security of Your Information</h2>
              
              <p className="mb-6">
                We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
              </p>
              
              <p className="mb-8">
                Any information disclosed online is vulnerable to interception and misuse by unauthorized parties. Therefore, we cannot guarantee complete security if you provide personal information.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">5. Policy for Children</h2>
              
              <p className="mb-8">
                We do not knowingly solicit information from or market to children under the age of 13. If you become aware of any data we have collected from children under age 13, please contact us using the contact information provided below.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">6. Options Regarding Your Information</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">Account Information</h3>
              
              <p className="mb-6">
                You may at any time review or change the information in your account or terminate your account by:
              </p>
              
              <ul className="list-disc pl-6 mb-8">
                <li className="mb-2">Logging into your account settings and updating your account</li>
                <li className="mb-2">Contacting us using the contact information provided below</li>
              </ul>
              
              <p className="mb-8">
                Upon your request to terminate your account, we will deactivate or delete your account and information from our active databases. However, some information may be retained in our files to prevent fraud, troubleshoot problems, assist with any investigations, enforce our Terms of Use and/or comply with legal requirements.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">7. Contact Us</h2>
              
              <p>
                If you have questions or comments about this Privacy Policy, please contact us at:
              </p>
              
              <p className="mt-4">
                SmartLearn, Inc.<br />
                123 Education Street<br />
                San Francisco, CA 94105<br />
                Email: privacy@smartlearn.com<br />
                Phone: (555) 123-4567
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
