# Wordstract

<div align="center">
  <img src="images/icon128.svg" width="128" height="128" alt="Wordstract Logo">
  
  <h3>Extract, Normalize, and Abstract Word Lists from the Web.</h3>

  <p>
    An advanced Chrome extension designed to crawl webpages, filter words by length, normalize special characters (e.g., Turkish to English), and create deduplicated word lists automatically.
  </p>
</div>

---

## 🚀 Features

- **Smart Normalization:** Automatically converts special characters to their English equivalents (e.g., `Çilek` → `cilek`, `Ağaç` → `agac`) and lowercases all output. Perfect for generating standard word lists for games or datasets.
- **Multi-Length Filtering:** Select multiple word lengths simultaneously (3, 4, 5, 6, 7, 8) to capture exactly what you need.
- **Auto-Navigation Mode:** Turn on Auto Mode to let the extension automatically scan the current page and randomly navigate to internal links, building a massive dataset while you sit back.
- **Tab Isolation:** Auto-navigation is isolated to the specific tab where it's enabled, letting you multitask without interference.
- **Regex-Powered Precision:** Uses robust regex patterns to correctly identify words across languages, ensuring no word is cut off (e.g., handles Turkish boundaries correctly).
- **Clipboard Ready:** Copy your entire unique list to the clipboard with a single click.

## 📦 Installation

Since Wordstract is an open-source developer tool, you can install it directly from the source:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/niyoseris/wordstract.git
    ```
2.  **Open Chrome Extensions:**
    -   Navigate to `chrome://extensions/` in your browser.
    -   Enable **Developer mode** in the top right corner.
3.  **Load Extension:**
    -   Click **Load unpacked**.
    -   Select the folder where you cloned this repository.
4.  **Pin & Use:** Pin the Wordstract icon to your toolbar for easy access!

## 🛠 Usage

1.  **Manual Scan:**
    -   Open the extension popup.
    -   Select the word lengths you want to capture (e.g., 5 and 6).
    -   Click **Scan Page**.
    -   The list will populate with unique, normalized words found on the page.

2.  **Auto Mode:**
    -   Toggle **Auto Navigation Mode**.
    -   The extension will scan the current page and then automatically simulate a click on a random internal link after a short delay.
    -   It will continue this process, accumulating words across pages until you stop it.

## 🤝 Contributing

Contributions are welcome! If you have ideas for new filtering logic or better crawling strategies:

1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---
<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/niyoseris">Niyoverse</a></sub>
</div>
