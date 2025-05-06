import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Separator } from "@/components/ui/separator";

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms of Service</h1>
            
            <p className="text-muted-foreground mb-8">
              Last Updated: October 10, 2023
            </p>
            
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="mb-6">
                Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the SmartLearn platform operated by SmartLearn, Inc. ("us", "we", "our").
              </p>
              
              <p className="mb-6">
                Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
              
              <p className="mb-8">
                By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">1. Accounts</h2>
              
              <p className="mb-6">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
              </p>
              
              <p className="mb-6">
                You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password.
              </p>
              
              <p className="mb-8">
                You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">2. Intellectual Property</h2>
              
              <p className="mb-6">
                The Service and its original content, features, and functionality are and will remain the exclusive property of SmartLearn, Inc. and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of SmartLearn, Inc.
              </p>
              
              <p className="mb-8">
                Course content and materials are provided to you solely for educational purposes. You may not copy, reproduce, distribute, transmit, display, sell, license, or otherwise exploit any content for any other purposes without the prior written consent of its respective owners.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">3. User Content</h2>
              
              <p className="mb-6">
                Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
              </p>
              
              <p className="mb-6">
                By posting Content on or through the Service, you represent and warrant that: (i) the Content is yours (you own it) or you have the right to use it and grant us the rights and license as provided in these Terms, and (ii) that the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person or entity.
              </p>
              
              <p className="mb-8">
                We reserve the right to terminate the account of anyone found to be infringing on a copyright or other intellectual property rights of others.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">4. Payment Terms</h2>
              
              <p className="mb-6">
                Some of our Services are available on a subscription basis. You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store.
              </p>
              
              <p className="mb-6">
                For subscription Services, you will be charged on a recurring basis until your subscription is canceled. You may cancel your subscription at any time through your account settings or by contacting us directly.
              </p>
              
              <p className="mb-8">
                We reserve the right to refuse any order placed through the Service. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">5. Termination</h2>
              
              <p className="mb-6">
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
              </p>
              
              <p className="mb-6">
                Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service or contact us to delete your account.
              </p>
              
              <p className="mb-8">
                All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">6. Limitation Of Liability</h2>
              
              <p className="mb-6">
                In no event shall SmartLearn, Inc., nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence) or any other legal theory, whether or not we have been informed of the possibility of such damage.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">7. Changes</h2>
              
              <p className="mb-6">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
              
              <h2 className="text-2xl font-bold mt-8 mb-4">8. Contact Us</h2>
              
              <p>
                If you have any questions about these Terms, please contact us at support@smartlearn.com.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
