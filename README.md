**MoMo Data Analysis Dashboard**

MoMo Data Analysis is a dashboard project built with JavaScript. It presents parsed MTN Mobile Money (MoMo) SMS data in a clean, structured, and informative way. The goal is to analyze common patterns from SMS messages like:

* Airtime purchases  
    
* Bundle purchases  
    
* Transfers (Sent & Received)  
    
* Promotional messages (like DesaDe)

***What This Dashboard Does***

Categorizes SMS messages into types:

* Sent Money  
    
* Received Money  
    
* Airtime Purchase  
    
* Bundle Purchase  
    
* Promotions (like DesaDe)

***Displays key data points:***

* Transaction Amounts  
    
* Dates and Times  
    
* Recipients/Senders  
    
* Balances after each transaction

Highlights patterns such as frequent transaction types, promotions, and balances.

 ***How It Works***

***1\. Raw SMS Parsing (Manual Preprocessing)***

The SMS data from MTN MoMo is manually pre-cleaned and grouped into categories like:

received\_money, sent\_money, bundles, airtime, promotions

Each message follows some identifiable pattern that allows classification:

* "You have received" → Received Money  
    
* "transferred to" → Sent Money  
    
* "Your payment of \_\_\_ RWF to Airtime" → Airtime Purchase  
    
* "gura \_\_\_ \= \_\_\_MB" → Data Bundle  
    
* "DesaDe" → Promotions

***2\. Static Dashboard Display***

* Each category is displayed in a separate section or table  
    
* Content is manually placed to simulate data cards, summaries, or logs.

 ***Project Structure***

momo\_data\_analysis/  
├── index.html         \# Main dashboard file  
├── style.css          \# All styling lives here  
├── README.md          

***Notes***

* No dynamic features: All messages and data are manually written into the HTML file.

