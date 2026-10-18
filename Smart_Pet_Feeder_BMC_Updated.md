# Group Assignment
## Title
### Business Model Canvas on
# Smart Pet Feeder

**Date:** 16 October 2026  
**Prepared by:**  
- **Major:** Computer Science and Engineering  
- **Academic Year:** 2024–2028 (Year 4, Semester 1)  
- **Room:** Prasat Takeo  
- **Group:** 3  

**Group Members:**
- **Name:** Chea Chenda, **ID:** 6093
- **Name:** Khorn Molika, **ID:** 5801
- **Name:** Heng Liza, **ID:** 5802
- **Name:** Ching Chayhour, **ID:** 5945
- **Name:** Kim Chantharo, **ID:** 5947
- **Name:** Nam Ayheng, **ID:** 5810
- **Name:** Em Panharith, **ID:** 7010

**Led by:** Lecturer Mr. Kong Bunthoeun

---

## Table of Contents

1. [I. Opportunity Identification](#i-opportunity-identification)
   - [1.1 Overview of the Opportunity](#11-overview-of-the-opportunity)
   - [1.2 Macro & Local Pet Ownership Trends in Cambodia](#12-macro--local-pet-ownership-trends-in-cambodia)
   - [1.3 Identified Market Gaps & Competitor Landscape](#13-identified-market-gaps--competitor-landscape)
   - [1.4 Strategic Opportunity Criteria Evaluation](#14-strategic-opportunity-criteria-evaluation)
2. [II. Problem Statement](#ii-problem-statement)
   - [An overview of your business idea (two or three sentences).](#an-overview-of-your-business-idea-two-or-three-sentences)
   - [A description of your product. What problems are you solving for your target customers?](#a-description-of-your-product-what-problems-are-you-solving-for-your-target-customers)
3. [III. Business Model Canvas](#iii-business-model-canvas)
   - [Customer Segment](#customer-segment)
   - [Value Proposition (Designing the innovative solution)](#value-proposition-designing-the-innovative-solution)
   - [Channel](#channel)
   - [Customer Relationship](#customer-relationship)
   - [Revenue Stream](#revenue-stream)
   - [Key Resource](#key-resource)
   - [Key Activities](#key-activities)
   - [Key Partners](#key-partners)
   - [Cost Structure](#cost-structure)
4. [IV. References (APA 7th Edition)](#iv-references-apa-7th-edition)
5. [V. Appendixes](#v-appendixes)
   - [Appendix A: Business Model Canvas 9-Block Summary Matrix](#appendix-a-business-model-canvas-9-block-summary-matrix)
   - [Appendix B: Empirical Hardware Bill of Materials (BOM) & KHMERES Component Sourcing Proof](#appendix-b-empirical-hardware-bill-of-materials-bom--khmeres-component-sourcing-proof)
   - [Appendix C: Detailed Financial Calculations, Unit Economics & Break-Even Analysis](#appendix-c-detailed-financial-calculations-unit-economics--break-even-analysis)

---

## I. Opportunity Identification

### 1.1 Overview of the Opportunity
Busy work schedules, long periods away from home, and unexpected commitments can make it difficult for pet owners to maintain consistent feeding routines. Smart feeding technology offers an opportunity to reduce dependence on manual feeding by combining automated scheduling with remote control.

Our Smart Pet Feeder aims to provide a convenient, affordable solution for pet owners in Cambodia through scheduled food dispensing, a Telegram Mini App, and feeding activity notifications. The business will initially target individual pet owners who need flexible feeding management, with opportunities to expand into pet care facilities as the product develops.

The commercial opportunity will be evaluated through customer feedback, competitor pricing, production costs, and willingness-to-pay research (Department of Management, n.d.).

### 1.2 Macro & Local Pet Ownership Trends in Cambodia
Over the past five years, urban centers in Cambodia—predominantly Phnom Penh, Siem Reap, and Battambang—have experienced a cultural transformation in pet guardianship. As household incomes rise and urbanization accelerates, pets (primarily domestic cats and small dogs) are increasingly regarded as family companions rather than working animals. This shift has stimulated substantial growth in pet shops, veterinary clinics, grooming salons, and premium pet food retail across districts such as Toul Kork, Boeung Keng Kang (BKK1), Chamkarmon, and Sen Sok.

However, modern urban living creates lifestyle friction:
- **Extended Working & Commuting Hours:** Young professionals, bank staff, corporate employees, and university students frequently spend 10 to 12 hours away from home due to work commitments, lectures, and Phnom Penh traffic congestion.
- **Strict Feeding Schedules:** Veterinarians emphasize that scheduled, portion-controlled meals prevent feline hepatic lipidosis, canine gastric dilation, obesity, and behavioral anxiety.
- **Frequent Connectivity Instability:** Residential fiber and Wi-Fi networks in Cambodia occasionally suffer from temporary ISP drops, router resets, or neighborhood power maintenance, making cloud-only imported feeders unreliable.

### 1.3 Identified Market Gaps & Competitor Landscape

| Competitor Category | Representative Products | Retail Price (Phnom Penh) | Key Advantages | Critical Deficiencies |
| :--- | :--- | :--- | :--- | :--- |
| **Traditional Gravity Feeders** | Generic plastic gravity hoppers | $5.00 – $12.00 | Very cheap; no electricity required. | Uncontrolled overfeeding; leads to pet obesity; no remote visibility or scheduling. |
| **Imported Global Smart Feeders** | Xiaomi Smart Pet Feeder, Petkit Fresh Element | $65.00 – $95.00 | Polished aesthetics; branded ecosystem; motorized anti-jam. | Expensive; requires separate proprietary mobile apps; no local warranty/repair in Cambodia; prone to cloud desync. |
| **Generic Chinese Tuya Feeders** | Tuya/Smart Life OEM Feeders | $42.00 – $58.00 | Moderate pricing; smartphone app support. | Inconsistent offline timekeeping; generic app UX; fragile plastic gears; zero local technical support or spare parts. |
| **Proposed Smart Pet Feeder (Our Solution)** | **Custom ESP32 + Telegram Mini App Feeder** | **$38.00 (Standard)** *(B2B Bulk: $30.00)* | **Telegram Mini App native (no app install); DS1302 offline schedule execution; 100% locally serviceable with parts from KHMERES.** | Prototype casing requires manual assembly; SG90S micro-servo suitable for small kibble only (must avoid large dog biscuits). |

### 1.4 Strategic Opportunity Criteria Evaluation
Following the entrepreneurship opportunity screening criteria outlined in the MGT-403 curriculum (Department of Management, n.d.):
1. **Customer Need:** Strong and immediate pain point among pet owners anxious about feeding routines while away.
2. **Execution Capability:** The multidisciplinary engineering team possesses hands-on expertise across ESP32 embedded C++, NestJS backend, MQTT networking, and Next.js frontend development.
3. **Competitive Differentiation:** Seamless Telegram integration (bypassing Google Play / Apple App Store downloads) combined with guaranteed battery-backed offline execution and local component availability.
4. **Unit Economics & Margin Viability:** Electronics BOM validated by real local quotations ($20 kit from KHMERES Electronics, 2026) ensuring over 45% contribution margins at scale.
5. **Growth Potential:** Scalable from initial B2C direct sales to local pet shops, veterinary clinics, cat cafes, and boarding facilities.

---

## II. Problem Statement

### An overview of your business idea (two or three sentences).
Our business develops the **Smart Pet Feeder**, an automated, app-connected nutrition management device that takes care of regular pet feeding. We aim to make feeding easier, more consistent, and less dependent on manual effort, so pets are fed on time and in the right amounts. Operating natively through a Telegram Mini App with an onboard battery-backed Real-Time Clock (RTC), the device ensures pets are fed measured dry food portions even during residential Wi-Fi and power disruptions.

### A description of your product. What problems are you solving for your target customers?

#### 1. Core Problems Solved for Target Customers
Pets need to be fed at regular times in measured amounts, but busy or unpredictable schedules can make this hard to manage. Feedings can be delayed, missed, or forgotten, and portions are often estimated rather than measured. People often struggle to maintain their pets' nutrition because of tight schedules (Zainuddin et al., 2024). Manual feeding also leaves no reliable record of when and how much a pet was fed.
- **Nutritional and Health Risks:** Missing meals or irregular routines causes serious complications, including feline hepatic lipidosis (fatty liver syndrome) and canine acid reflux.
- **Portion Guesswork vs. Obesity:** Inaccurate manual scoops lead to chronic overfeeding and pet obesity.
- **Alternative Flaws:** Traditional gravity hoppers ($5–$12) cause overfeeding, while imported smart feeders ($65–$95) are expensive, require separate apps, and desynchronize during Wi-Fi drops.

#### 2. Technical Product Description
The Smart Pet Feeder is an automated device that dispenses a set amount of pet food at scheduled times. Through its mobile app, users can set feeding schedules, control portion sizes, receive notifications, and view a feeding history log:
- **Core MCU & Power Regulation:** ESP32 30-Pin DevKit V1 mounted on an expansion base shield for clean 5V power and brownout prevention.
- **Rotary Shutter Gate:** SG90S micro-servo actuating a rotational shutter beneath a 1.8-liter airtight PET food hopper (storing 800g to 1kg dry kibble). Dispense duration is bounded in firmware between 200ms and 5000ms, followed by an enforced 3000ms motor cooldown.
- **Offline Timekeeping:** DS1302 Real-Time Clock with Sony CR2032 3V battery executing schedules on time without internet connectivity.
- **Local Interface:** 16x2 I2C LCD screen and active buzzer for melody chimes and alerts.
- **Local Component Sourcing:** Grounded in component pricing from KHMERES Electronics in Phnom Penh (KHMERES Electronics, 2026).

#### 3. Innovative Solution & Competitive Differentiation
The Smart Pet Feeder addresses this problem by dispensing measured portions on a schedule, so feeding no longer depends on someone being present. Similar IoT-based pet feeders have used automated food dispensing and smartphone control, showing how connected technology can make pet feeding more manageable (Castillo Rangel et al., 2024; Zainuddin et al., 2024).
- **Zero-Install Telegram Mini App:** Operates natively inside Telegram, removing third-party app download barriers.
- **Guaranteed Offline Resilience:** Pre-set schedules execute reliably regardless of home Wi-Fi drops.
- **Accessible Local Pricing & Warranty:** Priced at an accessible target price of $38.00 with 6-month local replacement and repair support in Phnom Penh.

---

## III. Business Model Canvas

This business model analysis follows the nine building blocks framework established by Osterwalder and Pigneur (2010), adhering to the opportunity screening and validation standards specified in the MGT-403 entrepreneurship curriculum (Department of Management, n.d.).

### Customer Segment

The Smart Pet Feeder serves two customer segments: individual pet owners and commercial pet care centers. Both require pets to be fed on time and in accurate amounts, but face distinct operational environments:

#### 1. Primary Target Segment — Busy Urban Pet Guardians (B2C)
- **Demographic & Geographical Profile:** Working professionals, bank employees, university students, corporate executives, medical staff, and shift workers aged 20–42 residing in urban centers in Cambodia (primarily Phnom Penh districts such as Toul Kork, Chamkarmon, Boeung Keng Kang, and Sen Sok, as well as Siem Reap and Battambang).
- **Household & Pet Profile:** Middle-to-upper-middle-income pet owners who keep 1 to 2 domestic cats or small-to-medium dry-food-fed dogs in apartments, condominiums, boreys, or rented townhouses.
- **Behavioral & Lifestyle Characteristics:**
  - *Busy professionals and university students:* Away from home for 10 to 12 hours daily due to fixed office hours, university lectures, and traffic bottlenecks.
  - *Frequent travelers and shift workers:* Irregular schedules make it impossible to maintain fixed morning or evening feeding routines.
  - *Forgetful owners:* Owners who occasionally forget mealtimes and require automated reminders and reliable scheduling.
  - *Heavy Telegram usage:* Use Telegram daily for personal and business communication and utilize Bakong KHQR for routine purchases.
- **Core Pains and Needs:** These owners cannot always feed their pets on time when away or when plans change. Relying on friends or neighbors provides no proof the pet was fed. They need reliable, controlled feeding they can confirm remotely without installing foreign applications.

#### 2. Secondary Segment — Commercial Pet Care Centers (B2B)
- **Commercial Profile:** Commercial pet care enterprises across Phnom Penh, including pet boarding facilities, daycare centers, training facilities, cat cafes (such as those in Toul Tompoung and BKK1), and veterinary recovery wards.
- **Operational Scale & Needs:** Staff is responsible for feeding multiple animals each day. Each pet may have a different feeding schedule and portion size, and feeding them all by hand takes extensive staff time. This raises the risk of missed meals, incorrect portions, and inconsistent routines, while making accurate feeding logs difficult to keep. These centers need a streamlined way to organize multi-pet feeding schedules, dispense correct portions, and maintain auditable records.

---

### Value Proposition (Designing the innovative solution)

Following the value proposition design framework of Osterwalder and Pigneur (2010), the Smart Pet Feeder couples critical pain relievers with distinct gain creators to deliver an innovative, localized solution (Department of Management, n.d.):

#### 1. Value Proposition for Individual Pet Owners (B2C)
- **Consistency:** Scheduled dispensing ensures meals happen on time regardless of work hours, traffic delays, travel, or forgotten mealtimes.
- **Proper Portions:** Controlled portion durations replace visual guesswork, supporting the pet's metabolic health and preventing obesity.
- **Peace of Mind:** Automated Telegram notifications and a timestamped feeding history log let owners confirm their pet was fed without relying on someone else.
- **Convenience:** Feeding schedules, manual feedings, and food level checks are managed directly from Telegram, eliminating the owner's physical presence.
- **Guaranteed Offline Reliability:** An onboard battery-backed DS1302 RTC executes schedules even during home Wi-Fi disconnects or power flickers.
- **Affordable Price:** High-quality smart feeding priced at **$38.00**—accessible to everyday pet owners, not just those willing to purchase expensive imported devices.

#### 2. Value Proposition for Commercial Pet Care Centers (B2B)
- **Time Savings:** Automated scheduled feeding substantially reduces the manual labor staff spend on daily feeding rounds, especially during night shifts.
- **Accuracy:** Controlled portions ensure each pet receives the correct dietary allocation, lowering the risk of missed or incorrect meals.
- **Accountability:** The digital feeding history log gives staff a verifiable audit trail of what each pet was fed, which can be shared with clients to build trust.
- **Facility Consistency:** Multi-pet schedules are kept synchronized across separate kennels and enclosures.
- **Cost-Effective Bulk Pricing:** Discounted commercial pricing (**$30.00 per unit** for orders of $\ge 5$ units) enables facilities to automate feeding across multiple animals without large capital expenditures.

---

### Channel

In accordance with Osterwalder and Pigneur (2010), channels are organized across the five stages: Awareness, Evaluation, Purchase, Delivery, and After-Sales Support (Department of Management, n.d.):

#### 1. Channels for Individual Pet Owners (B2C)
- **Awareness & Social Media Discovery:** Short demonstration videos and educational posts on TikTok, Facebook Reels, and Instagram showcasing real feeder operation, simulated Wi-Fi disconnect survival, and Telegram bot alerts aimed at busy owners, travelers, and shift workers. Engagement in Cambodian pet communities (*Cambodia Cat Lovers Club*, *Phnom Penh Pet Care*).
- **Evaluation & In-Store Displays:** Interactive working demonstration units placed in partner pet supply shops, grooming salons, and veterinary clinics in Toul Kork, BKK1, and Chamkarmon, allowing owners to inspect the feeder where they already seek pet advice.
- **Purchase & Payment:** Frictionless direct ordering through the Telegram Bot digital storefront supporting instant, zero-fee **Bakong KHQR** mobile payments and Cash on Delivery (COD).
- **Delivery & Fulfillment:** Same-day doorstep courier delivery across Phnom Penh via Grab Express and Foodpanda; provincial delivery via Virak Buntham (VET) Express.
- **After-Sales Support:** Dedicated Telegram customer support bot providing setup guides, video tutorials, and direct chat assistance.

#### 2. Channels for Commercial Pet Care Centers (B2B)
- **Direct Sales & Live Demonstrations:** On-site consultations and live demonstrations showing how the feeder handles multiple pets across separate kennels.
- **Business Social Media & Messaging:** Direct outreach through Facebook business pages and Telegram accounts where small pet enterprises manage inquiries.
- **Bulk Order Inquiries via Digital Form:** Streamlined quotation and multi-unit order processing with tiered commercial volume pricing.
- **White-Glove Batch Delivery & Training:** Units delivered directly to facilities with staff training on calibration, scheduling, and hopper sanitation.

---

### Customer Relationship

Customer relationships are structured around automated self-service and community co-design for individual consumers (B2C), combined with dedicated personal assistance and rapid replacement service for commercial accounts (B2B) (Osterwalder & Pigneur, 2010):

#### 1. Relationships with Individual Pet Owners (B2C)
- **Self-Service Through the App:** Owners manage feeding schedules independently through the Telegram Mini App, while automated telemetry and feeding logs keep them continuously engaged over time.
- **Real-Time Online Chat Support:** Owners can ask questions, troubleshoot connectivity, or report issues directly through the dedicated Telegram support bot.
- **Setup Guides & Tutorial Videos:** Short video tutorials and an interactive FAQ guide owners through unboxing, Wi-Fi provisioning, and sensor calibration.
- **6-Month Local Warranty & Replacement:** Full replacement or repair warranty honored locally in Phnom Penh using genuine parts from KHMERES Electronics, giving owners confidence in a device they rely on while away.
- **Online Community & Promotions:** Sharing pet nutrition tips, user stories, referral discounts, and feature voting inside an active Telegram user community.

#### 2. Relationships with Commercial Pet Care Centers (B2B)
- **Dedicated Personal Assistance:** Each center receives a direct contact (dedicated Telegram and phone hotline) for immediate support and urgent issues.
- **Installation & Onboarding:** The engineering team assists with on-site installation, app connection, schedule programming, and staff training.
- **Rapid After-Sales Support & Replacements:** Priority 12-to-24-hour hardware replacement in Phnom Penh ensures commercial feeding routines are never disrupted.
- **Long-Term Business Partnerships:** Regular operational check-ins paired with multi-unit expansion discounts to encourage centers to scale their automated setups.

---

### Revenue Stream

The venture generates revenue primarily through asset sales, supplemented by modular replacement parts, STEM educational kits, and value-added customization services (Department of Management, n.d.; Osterwalder & Pigneur, 2010):

#### 1. Revenue from Individual Pet Owners (B2C)
- **Direct Feeder Sales (Core Stream):** One-time retail sale of fully assembled Smart Pet Feeders at an accessible target price of **US$ 38.00** per unit.
  - *Pilot Phase Net Contribution (10–50 units):* **$8.05** per unit (**21.2%** contribution margin).
  - *Commercial Wholesale Net Contribution (100+ units):* **$18.12** per unit (**47.7%** contribution margin).
- **Maker / STEM DIY Kit Edition:** Pre-flashed electronics kit based on KHMERES parts + 3D printable STL files + digital manual for university students and robotics hobbyists at **US$ 28.00** per kit (**$11.50** contribution, **41.1%** margin).
- **Accessories & Replacement Parts:** High-margin modular upgrades sold via Telegram:
  - Replacement SG90S Micro Servo: **$3.50** (Wholesale Cost: $1.15 | Margin: 67%)
  - Stainless-Steel Anti-Bacterial Food Bowl: **$6.00** (Wholesale Cost: $2.20 | Margin: 63%)
  - Spare 5V 2A Regulated Power Supply: **$4.50** (Wholesale Cost: $1.50 | Margin: 67%)
  - Hopper Capacity Expansion Collar (+1.5L): **$5.00** (Wholesale Cost: $1.80 | Margin: 64%)
- **Value-Added Customization Services:** Custom laser engraving of pet name/photo on front acrylic panel (**$3.00**); white-glove home delivery and Wi-Fi setup in Phnom Penh (**$5.00**).

#### 2. Revenue from Commercial Pet Care Centers (B2B)
- **Multi-Unit Bulk Sales:** Discounted wholesale pricing of **US$ 30.00** per unit for orders of 5 or more units (yielding **$10.50** net contribution per unit; **35.0%** margin at wholesale scale).
- **Repeat & Expansion Orders:** Recurring hardware sales as commercial facilities open new branches or add boarding kennels.
- **Bulk Spare Parts & Maintenance Bundles:** Discounted spare container, servo, and sensor bundles for facility maintenance.

#### 3. Financial Summary & Break-Even Analysis
- **Fixed Monthly Operating Costs:** Cloud VPS ($15.00), Domain & SSL ($2.00), Telegram bot proxy ($3.00), Targeted social marketing baseline ($40.00), Workshop tools ($10.00). Total Fixed OpEx = **$70.00 / month** (**$840.00 / year**).
- **Monthly Break-Even Threshold:**
  - *Pilot Batch Economics ($8.05 contribution):* `$70.00 / $8.05 = 8.70` $\rightarrow$ **9 units per month**.
  - *Commercial Wholesale Economics ($18.12 contribution):* `$70.00 / $18.12 = 3.86` $\rightarrow$ **4 units per month**.
- **Annual Net Profit Projections (Commercial Wholesale Economics):**
  - *Conservative (15 units/mo):* Revenue: $6,840 | Net Profit: **$2,422 (35.4% Margin)**.
  - *Moderate Target (35 units/mo):* Revenue: $15,960 | Net Profit: **$6,770 (42.4% Margin)**.
  - *Aggressive Growth (+ B2B, 75 units/mo):* Revenue: $34,200 | Net Profit: **$15,468 (45.2% Margin)**.

---

### Key Resource

In accordance with Osterwalder and Pigneur (2010), key resources encompass the physical, intellectual, human, and digital assets required to sustain the business model:

#### 1. Physical Resources
- **ESP32 30P DevKit V1 Microcontroller:** The core processor running feeding schedules, state machine logic, and Wi-Fi/MQTT communications.
- **ESP32 30P Power Board Shield:** Dedicated expansion base shield distributing clean regulated 5V power and preventing motor brownouts.
- **SG90S Micro Servo Motor:** Actuates the precision rotational shutter gate beneath the hopper to release set amounts of food.
- **Food-Grade Hopper & Enclosure:** Airtight 1.8-liter PET food container (storing 800g to 1kg dry kibble) mounted within a laser-cut acrylic protective chassis.
- **DS1302 RTC + Sony CR2032 3V Battery:** Maintains accurate local time independently for $>2$ years without internet.
- **16x2 I2C LCD Screen & Active Buzzer:** Displays local status on-device and sounds auditory feeding chimes and alerts.
- **Regulated 5V 2A Power Adapter:** Continuous electrical supply for device electronics and motor actuation.
- **Assembly Equipment:** Soldering stations, digital multimeters, wire strippers, and calibration test jigs.

#### 2. Intellectual Resources
- **Next.js 15 Telegram Mini App:** Responsive mobile web application running natively inside Telegram, distinguishing our system from simple mechanical dispensers.
- **Embedded C++ Firmware Repository:** Codebase featuring non-volatile schedule storage (NVS), debounced manual feed buttons, and motor guard algorithms.
- **Cloud Microservice Stack:** NestJS REST API microservice, PostgreSQL database schema for multi-device logs, and Eclipse Mosquitto MQTT broker configuration.
- **Mechanical Blueprints & Calibration Lookup Tables:** CAD laser-cutting vector files and kibble density-duration calibration tables.

#### 3. Human Resources
- **Multidisciplinary 7-Member Student Engineering Team:**
  - *Chea Chenda (ID: 6093):* Product Management, Market Research & BMC Integration.
  - *Khorn Molika (ID: 5801):* Embedded Systems Lead, ESP32 Firmware & Hardware Prototyping.
  - *Heng Liza (ID: 5802):* Cloud Backend Lead, NestJS REST API & Mosquitto MQTT.
  - *Ching Chayhour (ID: 5945):* Frontend Lead, Next.js Telegram Mini App UI/UX Design.
  - *Kim Chantharo (ID: 5947):* Financial Modeling, Unit Economics & Sourcing Analysis.
  - *Nam Ayheng (ID: 5810):* Quality Assurance, Dispense Calibration & Hardware Testing.
  - *Em Panharith (ID: 7010):* Operations, Phnom Penh Logistics & Customer Support.

#### 4. Digital & Cloud Infrastructure
- Cloud Virtual Private Server (VPS) hosting the NestJS API, PostgreSQL database, and Mosquitto broker; Telegram Bot API tokens; GitHub version control repository.

---

### Key Activities

Operational activities are structured across four core pillars using the Lean Startup Build-Measure-Learn feedback loop (Osterwalder & Pigneur, 2010; Ries, 2011):

#### 1. Product Development & Production
- **Hardware Design & Modular Assembly:** Sourcing the ESP32, power shield, servo motor, sensors, and hoppers from local distributor KHMERES Electronics; batch assembling electronics onto power breakout shields.
- **Mechanical Dispenser Calibration:** Testing food gate tolerances across varying kibble sizes to ensure smooth flow without motor stalls.
- **Testing & Quality Control:** Rigorous 24-hour burn-in stress testing verifying that each unit dispenses correct portions on schedule, maintains time during simulated Wi-Fi disconnects, and sends accurate Telegram notifications.

#### 2. Software & App Development
- **Firmware Maintenance (ESP32 C++):** Optimizing offline schedule execution using the DS1302 RTC and managing non-volatile memory (NVS) storage.
- **Telegram Mini App & Cloud Backend Operations:** Deploying responsive Next.js 15 UI features, managing MQTT over TLS, and securing NestJS REST API endpoints.

#### 3. Marketing & Sales Operations
- **Digital Content Creation:** Producing demonstration videos and posts for TikTok, Facebook Reels, and Instagram to reach busy pet owners.
- **Sales & Order Handling:** Managing order fulfillment through the Telegram Bot storefront, reconciling Bakong KHQR payments, and processing B2B bulk orders.
- **Delivery & Distribution:** Packaging units with foam inserts and shipping via Grab Express/Foodpanda in Phnom Penh and VET Express provincially; stocking consignment inventory at partner pet shops and vet clinics.

#### 4. Customer Support & Continuous Improvement
- **Customer Support:** Answering inquiries, guiding onboarding via video guides, and processing local warranty repairs within 24 to 48 hours.
- **App Updates & Improvements:** Resolving software bugs, pushing OTA firmware enhancements, and refining features based on community feedback.

---

### Key Partners

Under the partnership framework of Osterwalder and Pigneur (2010), key partnerships optimize operations, reduce supply risks, and acquire external resources (Department of Management, n.d.):

#### 1. Technology & Supply Partners
- **KHMERES Electronics (Phnom Penh):** Primary local supplier of ESP32 boards, power shields, servos, RTCs, and electronics (Boeung Salang, Toul Kork; www.khmeres.com) (KHMERES Electronics, 2026).
- **Local Acrylic Laser-Cutting Workshops:** Precision fabrication partner in Toul Kork for custom acrylic feeder housings and gate flaps.
- **Cloud VPS & Telegram Platform:** Cloud hosting provider maintaining 99.9% API/broker uptime; Telegram Bot API providing the messaging and mini-app infrastructure.

#### 2. Sales & Distribution Partners
- **Pet Shops & Veterinary Clinics:** Showroom partners in Toul Kork, BKK1, and Chamkarmon displaying physical demonstration units on countertops and recommending the feeder to clients in exchange for 10% sales commissions.
- **Cat Cafes & Pet Boarding Centers (Pilot Users):** Commercial partners testing multi-device setups in live environments and providing testimonials.
- **Courier & Logistics Companies:** Grab Express and Foodpanda for same-day local delivery across Phnom Penh; Virak Buntham (VET) Express for provincial shipping.
- **National Bank of Cambodia (Bakong KHQR):** National payment rail enabling zero-fee mobile QR payments across all Cambodian banks.

---

### Cost Structure

Costs are structured according to Osterwalder and Pigneur's (2010) taxonomy, separating variable production costs, variable selling overhead, fixed monthly operating expenses, and one-time startup capital (Department of Management, n.d.):

#### 1. Variable Production Costs (COGS)
Component costs are verified directly through local distributor KHMERES Electronics in Phnom Penh ($20.00 Starter Kit / $14.65 individual electronics core) (KHMERES Electronics, 2026):

| Cost Item / Physical Component | Prototype (KHMERES Kit) | Pilot Batch (10–50 units) | Commercial Wholesale (100+ units) | Sourcing / Cost Notes |
| :--- | :---: | :---: | :---: | :--- |
| **Electronics Core (10 Components)** | $20.00 *(Full Kit)* | $14.65 | $8.88 | ESP32, power shield, servo, sensor, LCD, RTC, battery, button, buzzer, wires |
| **Food Hopper & Gate Chute (1.8L)** | $4.00 | $3.50 | $2.20 | Food-grade PET container with anti-spill chute |
| **Chassis & Protective Housing** | $3.50 | $2.50 | $1.50 | Precision laser-cut acrylic casing & fasteners |
| **Regulated 5V 2A Power Adapter** | $2.80 | $2.50 | $1.50 | 100–240V AC to 5V 2A DC adapter + 1.5m USB cable |
| **Packaging Box & Printed Guide** | $1.50 | $1.20 | $0.70 | Branded kraft box, foam inserts, quick manual |
| **Assembly, Flashing & QC Labor** | $0.00 *(Student work)* | $2.00 | $1.50 | Estimated assembly time: 25 minutes per unit |
| **Total Unit Production Cost (COGS)** | **$31.80** | **$26.35** | **$16.28** | **Direct manufacturing cost per finished unit** |

#### 2. Variable Selling Overhead (Per Unit Sold)
- Local Delivery Subsidy (Phnom Penh): **$1.50**
- Bakong KHQR Payment Buffer: **$0.20**
- Warranty & Defect Reserve Fund (5% of MSRP): **$1.90**
- **Total Direct Selling Overhead:** **$3.60** per unit (Consignment shop sales include an additional 10% commission of $3.80).

#### 3. Fixed Monthly Operating Expenses (Cloud & Operations)
- Cloud Virtual Private Server (VPS) (2 vCPU, 4GB RAM): **$15.00 / month**
- Domain Name & TLS Certificate: **$2.00 / month**
- Telegram Bot API Proxy Overhead: **$3.00 / month**
- Targeted Social Media Marketing Baseline: **$40.00 / month**
- Workshop Consumables & Maintenance: **$10.00 / month**
- **Total Fixed Monthly Operating Expenses:** **$70.00 / month** (**$840.00 / year**).

#### 4. One-Time Startup Capital Expenditure (CapEx)
- Sourcing initial prototype kit from KHMERES Electronics: **$20.00**
- Laser-cutting prototyping, tooling templates, and mechanical gate molds: **$50.00**
- Electrical test jigs, digital multimeter, and soldering tools: **$40.00**
- Initial demonstration showcase units for partner clinics: **$40.00**
- **Total One-Time Startup Capital:** **$150.00** (funded by student group members).

---

## IV. References (APA 7th Edition)

Castillo Rangel, A. V., Ponce, I. U., & Soto, I. (2024). Automatic pet feed system applying IoT. *Modelling, Measurement and Control D*, *45*(1–4), 87–93. https://doi.org/10.18280/mmc_d.451-413

Department of Management. (n.d.). *Foundations of modern entrepreneurship & business model canvas (BMC) framework: Comprehensive master study guide & syllabus reference (MGT-403)*. Department of Management, Faculty of Business, ACLEDA University of Business.

KHMERES Electronics. (2026). *ESP32 30Pin bluetooth + WiFi starter learning kit 40elements: Product catalogue and retail pricing*. Phnom Penh, Cambodia: KHMERES. Retrieved October 15, 2026, from https://www.khmeres.com

Osterwalder, A., & Pigneur, Y. (2010). *Business model generation: A handbook for visionaries, game changers, and challengers*. John Wiley & Sons.

Ries, E. (2011). *The lean startup: How today’s entrepreneurs use continuous innovation to create radically successful businesses*. Crown Business.

Zainuddin, A. A., Mahazir, M. N. B., Adanan, M. A. A., Mohd. Tamrin, M. I., Zulkfli, M. A. H., & Samsudin, M. H. A. (2024). Design and implementation of a mobile-controlled IoT smart pet feeder for busy pet owners. *Malaysian Journal of Science and Advanced Technology*, *4*(4), 498–505. https://doi.org/10.56532/mjsat.v4i4.383

---

## V. Appendixes

### Appendix A: Business Model Canvas 9-Block Summary Matrix

*This matrix condenses the operational, technological, and financial architecture of the Smart Pet Feeder into the 9 standard building blocks of Osterwalder and Pigneur (2010):*

| **Key Partners** | **Key Activities** | **Value Propositions** | **Customer Relationships** | **Customer Segments** |
| :--- | :--- | :--- | :--- | :--- |
| **Component Suppliers:**<br>• **KHMERES Electronics (Phnom Penh):** ESP32 DevKits, power boards, servos, sensors.<br>• **Acrylic Fabricators:** Local laser-cutting workshops in Toul Kork.<br><br>**Sales & Logistics:**<br>• **Pet Shops & Vets:** Consignment showcases in Toul Kork & BKK1 (10% commission).<br>• **Couriers:** Grab Express, Foodpanda, VET Express.<br>• **Payment:** Bakong KHQR (0% fee). | • Batch hardware assembly & wiring.<br>• ESP32 firmware & MQTT tuning.<br>• Kibble tolerance & servo dispense calibration.<br>• 24h burn-in stress testing.<br>• Telegram Mini App development.<br>• Social video marketing (TikTok & FB).<br>• Local technical warranty support. | **For Pet Owners (B2C):**<br>• **Zero-Install Telegram App:** Natively operates inside Telegram.<br>• **Offline Meal Guarantee:** DS1302 RTC dispenses without internet.<br>• **Nutritional Consistency:** Measured portions eliminate guessing.<br>• **Accessible Price:** $38.00 retail with 6-month Phnom Penh repair.<br><br>**For Pet Care Centers (B2B):**<br>• **Labor Savings:** Automates night feeding rounds.<br>• **Accountability:** Timestamped digital feeding logs.<br>• **Bulk Rate:** $30.00/unit for $\ge 5$ units. | **For Pet Owners (B2C):**<br>• **Self-Service:** 3-minute setup wizard inside Telegram.<br>• **Proactive Alerts:** Notifications on every feed & disconnect.<br>• **Direct Chat Care:** Student engineering hotline on Telegram.<br>• **6-Month Warranty:** Fast replacement in Phnom Penh.<br>• **User Co-Design:** Telegram group for feature updates.<br><br>**For Pet Care Centers (B2B):**<br>• **Personal Contact:** Dedicated account rep.<br>• **On-Site Setup:** White-glove installation.<br>• **Rapid Swap SLA:** 24h replacement guarantee. | **Primary (B2C) — Pet Guardians:**<br>• Working professionals, bank officers, and university students in Phnom Penh away from home for 10–12 hours.<br>• Frequent travelers & shift workers with irregular schedules.<br>• Owners of 1–2 domestic cats or small/medium dry-food dogs.<br><br>**Secondary (B2B) — Pet Care Centers:**<br>• Commercial boarding kennels.<br>• Cat cafes (Toul Tompoung, BKK1).<br>• Veterinary clinics with recovery wards.<br>• Animal rescue shelters managing multi-pet daily routines. |
| **Key Resources** | | | **Channels** | |
| **Physical:**<br>• ESP32 30P DevKit V1 & Power Shield.<br>• SG90S micro-servo gate mechanism.<br>• DS1302 RTC + Sony CR2032 3V battery.<br>• 16x2 I2C LCD display & active buzzer.<br>• 1.8L airtight PET hopper & chassis.<br>• 5V 2A regulated power adapter.<br><br>**Intellectual & Digital:**<br>• Next.js 15 Telegram Mini App.<br>• ESP32 C++ firmware repository.<br>• NestJS REST API & Mosquitto MQTT.<br><br>**Human:**<br>• 7-member CSE student engineering team. | | | **For Pet Owners (B2C):**<br>• **Awareness:** TikTok / Facebook Reels demo videos; Cambodian pet groups.<br>• **Evaluation:** Working countertop displays in partner pet shops and vet clinics.<br>• **Purchase:** Telegram Bot storefront with instant Bakong KHQR.<br>• **Delivery:** Grab Express / Foodpanda (Phnom Penh) & VET Express (provinces).<br>• **Support:** Direct Telegram support bot.<br><br>**For Pet Care Centers (B2B):**<br>• Direct on-site sales demonstrations.<br>• Business messaging via Facebook & Telegram.<br>• Bulk quote procurement on Telegram. | |
| **Cost Structure** | | **Revenue Streams** | | |
| **Variable Production Costs (COGS):**<br>• Electronics Core (KHMERES parts): $8.88–$14.65/unit.<br>• Hopper, Chassis, Power Adapter & Packaging: $7.40–$11.70/unit.<br>• **Total Production COGS:** **$16.28** (wholesale) to **$26.35** (pilot).<br><br>**Variable Selling Overhead:**<br>• Local delivery subsidy: $1.50.<br>• Bakong KHQR buffer: $0.20.<br>• 5% Warranty reserve fund: $1.90.<br>• Partner shop commission (consignment): $3.80.<br><br>**Fixed Monthly Operating Expenses (OpEx):**<br>• Cloud VPS (NestJS, Mosquitto, DB): $15.00/mo.<br>• Domain & TLS: $2.00/mo.<br>• Telegram bot proxy: $3.00/mo.<br>• Targeted social ads baseline: $40.00/mo.<br>• Workshop maintenance: $10.00/mo.<br>• **Total Fixed OpEx:** **$70.00 / month ($840.00 / year)**.<br><br>**One-Time Startup CapEx:** Prototype tools & test jigs: $150.00. | | **Revenue from Pet Owners (B2C):**<br>• **Direct Feeder Sales (Core):** Target MSRP **$38.00** per unit (Net contribution: $8.05 pilot / $18.12 wholesale; 21.2%–47.7% margin).<br>• **STEM / Maker DIY Kit:** **$28.00** per kit ($11.50 contribution, 41.1% margin).<br>• **Modular Spare Parts & Upgrades:** Replacement SG90S servo ($3.50), stainless-steel bowl ($6.00), 5V 2A power adapter ($4.50), hopper expansion collar ($5.00).<br>• **Customization Services:** Laser-engraved pet nameplate ($3.00), white-glove home setup in Phnom Penh ($5.00).<br><br>**Revenue from Pet Care Centers (B2B):**<br>• **Multi-Unit Bulk Sales ($\ge 5$ units):** Discounted price of **$30.00** per unit (Net contribution: $10.50/unit, 35.0% margin).<br>• **Repeat & Replacement Orders:** Recurring hardware expansion as facilities add kennels.<br><br>**Break-Even Threshold:** 4 to 9 units per month to cover all fixed operating expenses. | | |

---

### Appendix B: Empirical Hardware Bill of Materials (BOM) & KHMERES Component Sourcing Proof

The hardware bill of materials is grounded directly in the commercial catalogue of **KHMERES Electronics** (House #46, Street 261, Sangkat Boeung Salang, Khan Toul Kork, Phnom Penh; www.khmeres.com), utilizing the **ESP32 30Pin Bluetooth + WiFi Starter Learning Kit (40 Elements)** priced at **US$ 20.00** (KHMERES Electronics, 2026):

| Item # | Physical Component Name | Sourcing Status (KHMERES Kit) | ESP32 Pin & GPIO | Electrical Parameters | Functional System Purpose |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | **ESP32 30P DevKit V1 Board** | Included in $20 Kit | Core MCU | 3.3V Logic / 5V VIN, 240MHz Dual Core, Wi-Fi + BLE | Central processing unit, MQTT client, state machine, schedule controller. |
| **2** | **ESP32 30P Power Board Shield** | Included in $20 Kit | Host Base Shield | 5V DC Jack / USB input; 3.3V & 5V multi-pin power rails | Distributes clean regulated 5V power to servo, LCD, and sensor; prevents brownouts. |
| **3** | **SG90S Micro Servo Motor** | Included in $20 Kit | Pin 22 (GPIO 18) | 5V DC, PWM Signal (3.3V), 0° (Closed) to 85° (Open) | Actuates the rotational dispenser shutter gate; duration controlled in ms. |
| **4** | **16x2 I2C LCD Display Module** | Included in $20 Kit | Pin 24 (SDA / GPIO 21)<br>Pin 27 (SCL / GPIO 22) | 5V VCC, 3.3V I2C Bus (Address 0x27) | Visual on-device interface: displays local time, Wi-Fi status, next feeding schedule, countdown. |
| **5** | **DS1302 Real-Time Clock Module** | Included in $20 Kit | Pin 28 (CLK / GPIO 23)<br>Pin 23 (DAT / GPIO 19)<br>Pin 10 (RST / GPIO 26) | 3.3V VCC, 3-wire synchronous serial interface | Independent timekeeping; maintains schedule triggers even when Wi-Fi is disconnected. |
| **6** | **Sony CR2032 3V Lithium Battery** | Included in $20 Kit | Coin-cell slot on DS1302 | 3.0V DC, 220mAh | Backup power source ensuring the DS1302 RTC keeps time for $>2$ years without main power. |
| **7** | **Tactile Push Button** | Included in $20 Kit | Pin 11 (GPIO 27) | Active LOW (INPUT_PULLUP), debounced in firmware | Physical manual dispensing button for family members without smartphone access. |
| **8** | **Active Buzzer Module** | Included in $20 Kit | Pin 9 (GPIO 25) | 3.3V Digital Output, programmed audio chimes | Emits distinct tones: 2-tone feeding call chime, completion chirp, error alert beeps. |
| **9** | **Resistors & Jumper Wires** | Included in $20 Kit | Across circuit rails | Resistors, male-to-male & male-to-female leads | Circuit wiring, signal pull-ups, and module interconnects. |
| **10** | **External Regulated 5V 2A Adapter** | Sourced locally (Phnom Penh) | Micro-USB / DC Jack | 100–240V AC to 5V DC, 2.0A Regulated | Continuous, safe power supply for the entire feeder and servo motor. |
| **11** | **Food-Grade Hopper & Gate Chute** | Custom fabricated / PET | Mechanical structure | 1.8-Liter capacity (approx. 800g–1kg dry kibble) | Airtight food reservoir with rotary baffle gate and anti-spill dispensing chute. |
| **12** | **Device Protective Housing** | Laser-cut acrylic / enclosure | Enclosure chassis | Food-safe ABS / acrylic casing with cable relief | Encloses electronics, isolates food from circuits, provides stable countertop base. |

---

### Appendix C: Detailed Financial Calculations, Unit Economics & Break-Even Analysis

#### 1. Unit Contribution Margin Calculation (B2C Retail Channel)
* **Target Retail Selling Price (MSRP):** **$38.00**
* **Net Contribution Formula:**
  $$\text{Net Contribution} = \text{Selling Price} - \text{Unit Production Cost (COGS)} - \text{Variable Selling Expenses}$$

| Financial Parameter | Pilot Batch (10–50 units) | Commercial Wholesale (100+ units) | Remarks / Cost Breakdown |
| :--- | :---: | :---: | :--- |
| **Selling Price (MSRP)** | **$38.00** | **$38.00** | Accessible price vs. $65–$95 imported feeders |
| Less: Production Cost (COGS) | ($26.35) | ($16.28) | Complete hardware BOM + assembly labor |
| Less: Local Courier Subsidy | ($1.50) | ($1.50) | Flat subsidy for delivery across Phnom Penh |
| Less: Payment Processing (KHQR) | ($0.20) | ($0.20) | Bakong KHQR transfer fee buffer |
| Less: Warranty Reserve Fund (5%) | ($1.90) | ($1.90) | Reserve fund for repair or component swap |
| **Net Contribution per Unit** | **$8.05** | **$18.12** | **Cash contribution generated per unit sold** |
| **Contribution Margin Ratio** | **21.2%** | **47.7%** | **Strong margin expansion with scale** |

#### 2. Monthly Break-Even Analysis
* **Break-Even Formula:**
  $$\text{Break-Even Volume (Units)} = \frac{\text{Total Monthly Fixed Operating Expenses}}{\text{Net Contribution per Unit}}$$
* **Total Monthly Fixed Operating Expenses:** **$70.00 / month** ($840.00 / year).
* **Pilot Phase Break-Even Volume:**
  $$\frac{\$70.00}{\$8.05} = 8.70 \approx \mathbf{9\text{ units per month}}$$
* **Commercial Wholesale Break-Even Volume:**
  $$\frac{\$70.00}{\$18.12} = 3.86 \approx \mathbf{4\text{ units per month}}$$

#### 3. Annual Sales & Net Operating Profit Projections (Commercial Wholesale Economics)

| Sales Projection Scenario | Monthly Volume | Annual Units Sold | Total Annual Revenue | Total Annual COGS | Annual Fixed Costs | Annual Selling & Warranty Costs | Net Annual Operating Profit | Net Profit Margin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Conservative Scenario** | 15 units | 180 units | $6,840 | $2,930 | $840 | $648 | **$2,422** | **35.4%** |
| **Moderate Target Scenario** | 35 units | 420 units | $15,960 | $6,838 | $840 | $1,512 | **$6,770** | **42.4%** |
| **Aggressive Growth (+ B2B)** | 75 units | 900 units | $34,200 | $14,652 | $840 | $3,240 | **$15,468** | **45.2%** |

*Interpretation:* Even under a conservative scenario of selling only 15 units per month across Phnom Penh, the venture generates **$2,422 in annual net profit** after fully covering all cloud hosting, marketing, warranty reserves, and production costs.
