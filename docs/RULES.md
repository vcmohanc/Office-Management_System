# Coding Rules & Guidelines

## 1. General Principles
- **Keep it Simple:** Avoid over-engineering. Use standard React patterns.
- **Readability Over Cleverness:** Write code that is easy for other developers to read and maintain.

## 2. React & Frontend
- **Functional Components:** Use functional components and Hooks (`useState`, `useEffect`). No class components.
- **State Management:** Keep state as localized as possible. Lift state up (e.g., `activeTab` in `Dashboard.jsx`) only when necessary for sibling communication.
- **File Structure:** Group components by feature/department (e.g., `components/hr/`, `components/account/`).

## 3. Styling (Tailwind CSS)
- **Utility-First:** Use Tailwind classes for all styling. Do not write custom CSS in `.css` files unless absolutely necessary for complex animations or overrides not supported by Tailwind.
- **Color Consistency:** Stick to the defined palette in `DESIGN.md`. Use arbitrary values (e.g., `bg-[#162D50]`) if a specific brand color is needed that isn't in the default Tailwind palette.
- **Spacing:** Use standard Tailwind spacing scales (`p-4`, `m-2`, `gap-6`) to maintain rhythm.

## 4. Backend (Node/Express)
- **MVC Pattern:** Separate concerns into `routes/`, `models/`, and `middleware/`.
- **Async/Await:** Use `async/await` for all asynchronous database operations. Avoid raw `.then()` chains for readability.
- **Error Handling:** Wrap route handlers in `try/catch` blocks and return appropriate HTTP status codes (e.g., 400 for bad requests, 500 for server errors).

## 5. Assets & Media
- **Icons:** Use `lucide-react` exclusively. Do not mix icon libraries (e.g., FontAwesome, Heroicons) to maintain a cohesive look.
- **Language:** All user-facing text and placeholders must be written in Japanese, using the terminology defined in `立替・精算管理システム 要件定義.docx` (e.g. 申請者, 立替者, 費用負担先). Code identifiers (variables, functions) remain in English.

## 6. Git & Version Control
- **Commits:** Use conventional commit messages (e.g., `feat: add staff registration form`, `fix: correct typo in sidebar`).
- **Exclusions:** Ensure `.env` and `node_modules/` are explicitly listed in `.gitignore`.
