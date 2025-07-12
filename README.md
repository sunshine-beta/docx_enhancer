# 📄 DocxEnhancer

DocxEnhancer is an AI-powered web application that allows users to upload `.docx` files formatted with MCQs and receive a richly enhanced version of the document. It intelligently adds answers, explanations, and references using the OpenAI Assistant API — helping educators, students, and content creators save time and effort.

---

## ✨ Features

* Upload `.docx` files with:

  ```
  Question:
  [MCQ options]
  Explanation:
  ```
* Automatically enriches the document by adding:

  * ✅ Correct Answer
  * 💡 Enhanced Explanation
  * 🔗 Reference (optional)
* Edit generated explanations or transform content into AI prompts
* Download the enhanced `.docx` file
* Powered by OpenAI's Assistant API
* Real-time processing with `Next.js`, `Express`, and `Node.js`

---

## 🚀 Tech Stack

| Frontend     | Backend         | AI/Processing            |
| ------------ | --------------- | ------------------------ |
| Next.js      | Express.js      | OpenAI Assistant API     |
| React        | Node.js         | Mommuth (docx parsing)   |
| Tailwind CSS | Multer (upload) | Custom Enhancement Logic |

---

## 📂 Folder Structure

```bash
/DocxEnhancer
├── backend
│    ├── config
│    │    └── mongoose.connection.js
│    ├── models
│    │    └── document.model.js
│    ├── package.json
│    ├── package-lock.json
│    ├── routes
│    │    └── document.route.js
│    ├── schemas
│    │    ├── document.schema.js
│    │    └── question.schema.js
│    ├── server.js
│    └── utils
│        └── parseQuestion.js
└── frontend
    ├── app
    │   ├── batch
    │   │   └── [id]
    │   │    └── page.tsx
    │   ├── globals.css
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── prompt
    │        └── page.tsx
    ├── components
    │   ├── app-sidebar.tsx
    │   ├── improve-dialog.tsx
    │   ├── theme-provider.tsx
    │   ├── ui
    │   │   └── [... dozens of ui components ...]
    │   └── upload-dialog.tsx
    ├── components.json
    ├── hooks
    │   ├── use-mobile.tsx
    │   └── use-toast.ts
    ├── lib
    │   └── utils.ts
    ├── next.config.mjs
    ├── next-env.d.ts
    ├── package.json
    ├── pnpm-lock.yaml
    ├── postcss.config.mjs
    ├── public
    │   ├── placeholder.jpg
    │   ├── placeholder-logo.png
    │   ├── placeholder-logo.svg
    │   ├── placeholder.svg
    │   └── placeholder-user.jpg
    ├── tailwind.config.ts
    └── tsconfig.json
```

---

## ⚙️ Setup Instructions

1. **Clone the repo:**

```bash
git clone https://github.com/ExploitEngineer/DocxEnhancer.git
cd DocxEnhancer
```

2. **Install dependencies:**

```bash
# For backend
cd backend
npm install

# For frontend
cd ../frontend
npm install
```

3. **Create `.env` file in `/backend` with:**

```
OPENAI_API_KEY=your_openai_api_key
PORT=5000
```

4. **Run the app:**

```bash
# Run backend
cd backend
npm run dev

# Run frontend
cd ../frontend
npm run dev
```

Visit `http://localhost:3000` to get started!

---

## 🚀 Example `.docx` Format

```text
Question:
Which protocol does HTTPS use?
A. FTP
B. SSH
C. TLS
D. TCP

Explanation:
Used for secure communication.
```

> The output will add:

* **Answer: C. TLS**
* **Explanation: HTTPS uses TLS (Transport Layer Security) to encrypt communications between web clients and servers.**
* **Reference: [Wikipedia - HTTPS](https://en.wikipedia.org/wiki/HTTPS)**

---

## 📗 License

MIT License. Free for personal and commercial use.

---

## ✈️ Contribution

Pull requests, issues, and discussions are welcome! Let’s improve AI-enhanced education tools together.

---

## 📢 Contact

Made with ❤️ by [ExploitEngineer](https://github.com/ExploitEngineer)

---
