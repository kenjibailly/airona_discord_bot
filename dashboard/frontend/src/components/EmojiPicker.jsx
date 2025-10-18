import { useState } from "react";
import styles from "../styles/EmojiPicker.module.css";

// Common Unicode emojis grouped by category
const standardEmojis = {
  "Smileys": ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴"],
  "Gestures": ["👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💪", "🖕", "✍️", "🙏", "🦶", "🦵"],
  "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝"],
  "Animals": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦆", "🦅", "🦉", "🦇", "🐺", "🐗", "🐴", "🦄", "🐝", "🐛", "🦋", "🐌", "🐞", "🐢", "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞", "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈"],
  "Food": ["🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️", "🌽", "🥕", "🧄", "🧅", "🥔", "🍠", "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕"],
  "Activities": ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊", "🥋", "🎽", "🛹", "🛷", "⛸️", "🥌", "🎿", "⛷️", "🏂"],
  "Objects": ["⌚", "📱", "💻", "⌨️", "🖥️", "🖨️", "🖱️", "🖲️", "🕹️", "🗜️", "💾", "💿", "📀", "📼", "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭", "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳"],
  "Symbols": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐", "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓", "🆔", "⚛️", "🉑", "☢️", "☣️", "📴", "📳", "🈶", "🈚", "🈸", "🈺", "🈷️", "✴️", "🆚", "💮", "🉐", "㊙️", "㊗️"],
};

export default function EmojiPicker({ customEmojis = [], onSelect, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState("Smileys");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = ["Custom", ...Object.keys(standardEmojis)];

  const getFilteredEmojis = () => {
    if (selectedCategory === "Custom") {
      if (searchTerm) {
        return customEmojis.filter(emoji => 
          emoji.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return customEmojis;
    }

    const categoryEmojis = standardEmojis[selectedCategory] || [];
    return categoryEmojis;
  };

  const filteredEmojis = getFilteredEmojis();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.picker} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <input
            type="text"
            placeholder="Search emojis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.search}
          />
          <button onClick={onClose} className={styles.closeButton}>✕</button>
        </div>

        <div className={styles.categories}>
          {categories.map(category => (
            <button
              key={category}
              className={`${styles.categoryButton} ${selectedCategory === category ? styles.active : ""}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className={styles.emojiGrid}>
          {filteredEmojis.length === 0 ? (
            <div className={styles.noResults}>No emojis found</div>
          ) : (
            filteredEmojis.map((emoji, index) => {
              if (selectedCategory === "Custom") {
                return (
                  <button
                    key={emoji.id}
                    className={styles.emojiButton}
                    onClick={() => onSelect(emoji)}
                    title={emoji.name}
                  >
                    <img 
                      src={emoji.url} 
                      alt={emoji.name}
                      className={styles.customEmoji}
                    />
                  </button>
                );
              } else {
                return (
                  <button
                    key={index}
                    className={styles.emojiButton}
                    onClick={() => onSelect({ native: emoji, name: emoji })}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                );
              }
            })
          )}
        </div>
      </div>
    </div>
  );
}