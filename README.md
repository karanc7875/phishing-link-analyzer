Phishing Link Analyzer

This project is a small web app made to check whether a website link looks safe or suspicious.

It is designed to help people spot phishing attempts, fake login pages, and risky URLs before clicking them.

* What this app does:
  
Lets a user paste a website link
Checks the link for common phishing signs
Gives a risk score from 0 to 100
Shows whether the result is safe, warning, or dangerous
Stores recent scan history in the browser
Includes a simple dashboard and profile page

* Why it exists:
  
Phishing links often look real at first glance. They may use fake login pages, urgent messages, or copied brand names. This app helps users look at the link structure and assess risk in a simple way.

* How to use it:
  
Open the project in a browser.
Create an account or log in.
Go to the scanner page.
Enter a URL such as https://example.com.
Review the score and risk details.

* Project pages:
  
index.html - login page
register.html - sign up page
dashboard.html - main overview page
scanner.html - URL scanning page
result.html - shows analysis result
history.html - shows past scan results
profile.html - user settings

* Tech used:
This project is built mainly with:

HTML
CSS
JavaScript

It uses browser local storage to save demo users, login state, and scan history.

* Notes:
  
This is a demo project for learning and presentation purposes. It does not connect to a real live phishing database or backend API yet. The scanning logic is a front-end mock system meant to show how a phishing analyzer could work.

* Simple summary:
  
This app is a basic phishing link checker built for demo use. It helps users understand how suspicious links can be detected by looking at patterns like fake urgency, unsafe URLs, and risky domain behavior.
