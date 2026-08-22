# Design Guidelines

## Core Philosophy
The OMS platform is designed with a **"professional, clean, and airy"** aesthetic. It aims to reduce cognitive load for administrators and staff by providing clear hierarchy, ample whitespace, and focused actions.

## Layout Structure
- **Sidebar (Left):** Static navigation pane. Grouped by department. Active states are highlighted with bold text and a dark background `bg-gray-200 text-[#162D50]`.
- **Top Header:** Displays contextual breadcrumbs (Current Department/Tab) and user profile information.
- **Main Content Area (Right):** A fluid container with `p-8` padding. Background is a soft `#F8F9FA` to make white component cards "pop".

## Color Palette
- **Primary Brand:** `#162D50` (Deep Navy Blue) - Used for primary buttons, active text, and prominent icons.
- **Backgrounds:** 
  - App Background: `#F8F9FA`
  - Cards/Containers: `#FFFFFF`
  - Subtle Sections (like form headers): `bg-gray-50`
- **Text:** 
  - Primary text: `text-gray-900` or `text-gray-800`
  - Secondary text / Labels: `text-gray-500`
- **Status Indicators:**
  - Success/Approved: `bg-green-100 text-green-800`
  - Warning/Pending: `bg-yellow-100 text-yellow-800`
  - Info/Processing: `bg-blue-100 text-blue-800`
  - Error/Action Required: `bg-red-100 text-red-800`

## Components
- **Cards:** White background, `rounded-xl` or `rounded-lg`, subtle shadow (`shadow-sm`), and a faint border (`border-gray-200`).
- **Buttons:**
  - Primary: Solid `#162D50` background, white text. Hover state darkens to `#0f1f38`.
  - Secondary/Action: Light gray `bg-[#E2E8F0]` with `#4A5568` text.
- **Forms:** Inputs must have visible borders (`border-gray-300`), internal padding (`px-4 py-2.5`), and a blue focus ring (`focus:ring-2 focus:ring-blue-500`).

## Language
- The application interface is strictly in **English**. Any reference material provided in other languages (e.g., Japanese screenshots) must be translated to professional English equivalents.
