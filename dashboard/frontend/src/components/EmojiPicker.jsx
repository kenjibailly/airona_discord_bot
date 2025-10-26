import { useState } from "react";
import styles from "../styles/EmojiPicker.module.css";

// Common Unicode emojis grouped by category
const standardEmojis = {
  Smileys: [
    "😀",
    "😃",
    "😄",
    "😁",
    "😆",
    "😅",
    "🤣",
    "😂",
    "🙂",
    "🙃",
    "😉",
    "😊",
    "😇",
    "🥰",
    "😍",
    "🤩",
    "😘",
    "😗",
    "😚",
    "😙",
    "😋",
    "😛",
    "😜",
    "🤪",
    "😝",
    "🤑",
    "🤗",
    "🤭",
    "🤫",
    "🤔",
    "🤐",
    "🤨",
    "😐",
    "😑",
    "😶",
    "😏",
    "😒",
    "🙄",
    "😬",
    "🤥",
    "😌",
    "😔",
    "😪",
    "🤤",
    "😴",
  ],
  Gestures: [
    "👍",
    "👎",
    "👊",
    "✊",
    "🤛",
    "🤜",
    "🤞",
    "✌️",
    "🤟",
    "🤘",
    "👌",
    "🤏",
    "👈",
    "👉",
    "👆",
    "👇",
    "☝️",
    "✋",
    "🤚",
    "🖐️",
    "🖖",
    "👋",
    "🤙",
    "💪",
    "🖕",
    "✍️",
    "🙏",
    "🦶",
    "🦵",
  ],
  Hearts: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
  ],
  Animals: [
    "🐶",
    "🐱",
    "🐭",
    "🐹",
    "🐰",
    "🦊",
    "🐻",
    "🐼",
    "🐨",
    "🐯",
    "🦁",
    "🐮",
    "🐷",
    "🐸",
    "🐵",
    "🐔",
    "🐧",
    "🐦",
    "🐤",
    "🦆",
    "🦅",
    "🦉",
    "🦇",
    "🐺",
    "🐗",
    "🐴",
    "🦄",
    "🐝",
    "🐛",
    "🦋",
    "🐌",
    "🐞",
    "🐢",
    "🐍",
    "🦎",
    "🦖",
    "🦕",
    "🐙",
    "🦑",
    "🦐",
    "🦞",
    "🦀",
    "🐡",
    "🐠",
    "🐟",
    "🐬",
    "🐳",
    "🐋",
    "🦈",
  ],
  Food: [
    "🍎",
    "🍊",
    "🍋",
    "🍌",
    "🍉",
    "🍇",
    "🍓",
    "🍈",
    "🍒",
    "🍑",
    "🥭",
    "🍍",
    "🥥",
    "🥝",
    "🍅",
    "🍆",
    "🥑",
    "🥦",
    "🥬",
    "🥒",
    "🌶️",
    "🌽",
    "🥕",
    "🧄",
    "🧅",
    "🥔",
    "🍠",
    "🥐",
    "🥯",
    "🍞",
    "🥖",
    "🥨",
    "🧀",
    "🥚",
    "🍳",
    "🧈",
    "🥞",
    "🧇",
    "🥓",
    "🥩",
    "🍗",
    "🍖",
    "🦴",
    "🌭",
    "🍔",
    "🍟",
    "🍕",
  ],
  Activities: [
    "⚽",
    "🏀",
    "🏈",
    "⚾",
    "🥎",
    "🎾",
    "🏐",
    "🏉",
    "🥏",
    "🎱",
    "🪀",
    "🏓",
    "🏸",
    "🏒",
    "🏑",
    "🥍",
    "🏏",
    "🥅",
    "⛳",
    "🪁",
    "🏹",
    "🎣",
    "🤿",
    "🥊",
    "🥋",
    "🎽",
    "🛹",
    "🛷",
    "⛸️",
    "🥌",
    "🎿",
    "⛷️",
    "🏂",
  ],
  Objects: [
    // Tech & Devices
    "⌚",
    "📱",
    "📲",
    "💻",
    "⌨️",
    "🖥️",
    "🖨️",
    "🖱️",
    "🖲️",
    "🕹️",
    "🗜️",
    "💾",
    "💿",
    "📀",
    "📼",
    "📷",
    "📸",
    "📹",
    "🎥",
    "📽️",
    "🎞️",
    "📡",
    "📺",
    "📻",
    "🎙️",
    "🎚️",
    "🎛️",
    "🧭",
    "⏱️",
    "⏲️",
    "⏰",
    "🕰️",
    "⌛",
    "⏳",

    // Light, Tools, Construction
    "🔋",
    "🔌",
    "💡",
    "🔦",
    "🕯️",
    "🧯",
    "🪔",
    "🔧",
    "🔨",
    "⚒️",
    "🛠️",
    "⛏️",
    "🪓",
    "🔩",
    "⚙️",
    "🪤",
    "🧰",
    "🪛",
    "🔫",
    "🧱",
    "🪵",
    "🪜",
    "⚖️",
    "🪣",
    "🧲",

    // Office & Stationery
    "📁",
    "📂",
    "🗂️",
    "📅",
    "📆",
    "🗒️",
    "🗓️",
    "📇",
    "📈",
    "📉",
    "📊",
    "📋",
    "📌",
    "📍",
    "📎",
    "🖇️",
    "📏",
    "📐",
    "✂️",
    "🖊️",
    "🖋️",
    "✒️",
    "📝",
    "✏️",
    "🖍️",
    "🖌️",
    "🗃️",
    "🗄️",
    "🗑️",

    // Money & Mail
    "💰",
    "🪙",
    "💴",
    "💵",
    "💶",
    "💷",
    "💸",
    "💳",
    "🧾",
    "✉️",
    "📧",
    "📨",
    "📩",
    "📤",
    "📥",
    "📦",
    "📫",
    "📪",
    "📬",
    "📭",
    "📮",
    "🗳️",

    // Household Items
    "🪞",
    "🪟",
    "🛏️",
    "🛋️",
    "🪑",
    "🚪",
    "🚿",
    "🛁",
    "🪠",
    "🧴",
    "🧼",
    "🧽",
    "🪥",
    "🧻",
    "🚽",
    "🪒",
    "🪮",
    "🧺",
    "🧹",
    "🧺",
    "🧼",
    "🧽",
    "🪣",

    // Clothing & Accessories
    "👓",
    "🕶️",
    "🥽",
    "🥼",
    "🦺",
    "👔",
    "👕",
    "👖",
    "🧣",
    "🧤",
    "🧥",
    "🧦",
    "👗",
    "👘",
    "🥻",
    "🩱",
    "🩲",
    "🩳",
    "👙",
    "👚",
    "👛",
    "👜",
    "👝",
    "🛍️",
    "🎒",
    "👞",
    "👟",
    "🥾",
    "🥿",
    "👠",
    "👡",
    "🩴",
    "👢",
    "🪮",
    "👑",
    "👒",
    "🎩",
    "🎓",
    "🧢",
    "🪖",
    "⛑️",
    "📿",
    "💄",
    "💍",
    "💎",

    // Signs & Instruments
    "🎈",
    "🎉",
    "🎊",
    "🎎",
    "🎏",
    "🎐",
    "🎀",
    "🎁",
    "🪄",
    "🪅",
    "🪆",
    "🧸",
    "🪀",
    "🪁",
    "⚽",
    "🏀",
    "🏈",
    "⚾",
    "🎾",
    "🏐",
    "🏉",
    "🥏",
    "🎱",
    "🏓",
    "🏸",
    "🥅",
    "🏒",
    "🏑",
    "🏏",
    "⛳",
    "🏹",
    "🎣",
    "🤿",
    "🎽",
    "🎿",
    "🛷",
    "🥌",
    "🎯",
    "🪃",
    "🪚",
    "🪓",

    // Art, Music & Misc
    "🎹",
    "🥁",
    "🪘",
    "🎷",
    "🎺",
    "🎸",
    "🪕",
    "🎻",
    "🎼",
    "🎧",
    "🎤",
    "🎬",
    "🎮",
    "🧩",
    "♟️",
    "🃏",
    "🀄",
    "🎴",
    "🎭",
    "🖼️",
    "🪩",
    "🪞",
    "🧮",

    // Religious & Symbolic
    "🛐",
    "⚰️",
    "⚱️",
    "🪦",
    "🕋",
    "⛩️",
    "🛕",
    "🕍",
    "⛪",
    "🕌",
    "🕋",
    "🛐",
    "🪯",

    // Transportation-related objects
    "🛢️",
    "⛽",
    "🧭",
    "🚦",
    "🚥",
    "🛑",
    "🧱",
    "⚙️",
    "🛠️",
    "🧰",
    "🧲",

    // Miscellaneous objects
    "🔮",
    "🧿",
    "🪬",
    "🩸",
    "💊",
    "💉",
    "🩹",
    "🩼",
    "🩺",
    "🩻",
    "🧬",
    "🧪",
    "🧫",
    "🧯",
    "⚗️",
    "🧲",
    "🧱",
    "🧰",
    "🧺",
    "🧴",
    "🧷",
    "🧹",
    "🧻",
    "🪠",
    "🧼",
    "🧽",
    "🧯",

    "🛡️",
    "🔑",
    "🗝️",
    "🛒",
    "🧨",
    "🧷",
    "🧶",
    "🧵",
    "🧪",
    "🧫",
    "🪑",
    "🛋️",
    "🛏️",
    "🧸",
    "🧭",
    "🪩", // mirror ball (disco)
    "🪮", // comb
    "🪡", // sewing needle
    "🪢", // knot
    "🪤", // mousetrap (you have but appears twice — keep one)
    "🪣", // bucket
    "🪤", // (ensure only once)
    "🪥", // toothbrush
    "🪦", // headstone
    "🪧", // placard/sign
    "🪪", // identification card
    "🪫", // low battery
    "🪬", // hamsa (religious)
    "🪭", // folding hand fan
    "🪮", // comb (if not added yet)
    "🪰", // fly (belongs to Animals, but often misc)
    "🪱", // worm (Animals)
    "🪳", // cockroach (Animals)
    "🪴", // potted plant
    "🪵", // wood log
    "🪶", // feather
    "🪷", // lotus
    "🪹", // empty nest
    "🪺", // nest with eggs
  ],

  Symbols: [
    "❤️",
    "🧡",
    "💛",
    "💚",
    "💙",
    "💜",
    "🖤",
    "🤍",
    "🤎",
    "💔",
    "❣️",
    "💕",
    "💞",
    "💓",
    "💗",
    "💖",
    "💘",
    "💝",
    "💟",
    "☮️",
    "✝️",
    "☪️",
    "🕉️",
    "☸️",
    "✡️",
    "🔯",
    "🕎",
    "☯️",
    "☦️",
    "🛐",
    "⛎",
    "♈",
    "♉",
    "♊",
    "♋",
    "♌",
    "♍",
    "♎",
    "♏",
    "♐",
    "♑",
    "♒",
    "♓",
    "🆔",
    "⚛️",
    "🉑",
    "☢️",
    "☣️",
    "📴",
    "📳",
    "🈶",
    "🈚",
    "🈸",
    "🈺",
    "🈷️",
    "✴️",
    "🆚",
    "💮",
    "🉐",
    "㊙️",
    "㊗️",
    "✅",
    "❌",
    "❗",
    "‼️",
    "⁉️",
    "⚠️",
    "🔔",
    "🔕",
    "🔇",
    "🔈",
    "🔉",
    "🔊",
    "🔒",
    "🔓",
    "🔏",
    "🔐",
    "⚙️",
    "⚖️",
    "⚔️",
    "⚰️",
    "⚱️",
    "⚗️",
    "⚕️",
    "⚜️",
    "✂️",
    "✏️",
    "✒️",
    "✍️",
    "✉️",
    "✈️",
    "✡️",
    "✔️",
    "☑️",
    "☔",
    "☁️",
    "☃️",
    "☄️",
    "☀️",
    "⭐",
    "🌟",
    "🌈",
    "❄️",
    "❇️",
    "❎",
    "©️",
    "®️",
    "™️",
    "➕",
    "➖",
    "➗",
    "➰",
    "➿",
    "➜",
    "➡️",
    "⬅️",
    "⬆️",
    "⬇️",
    "↔️",
    "↕️",
    "🔄",
    "🔁",
    "🔂",
    "🔃",
    "🔼",
    "🔽",
    "🔺",
    "🔻",
    "🔸",
    "🔹",
    "🔶",
    "🔷",
    "🔳",
    "🔲",
    "◼️",
    "◻️",
    "◾",
    "◽",
    "▪️",
    "▫️",
    "🔘",
    "🔴",
    "🟠",
    "🟡",
    "🟢",
    "🔵",
    "🟣",
    "⚫",
    "⚪",
    "🔺",
    "🔻",
    "⚧️", // transgender symbol
    "⚰️", // coffin (you have but ensure one)
    "⚱️", // urn
    "🕎", // menorah (duplicate okay)
    "🪯", // khanda (Sikh)
    "🕉️", // om (you have)
    "☮️", // peace (you have)
    "♾️", // infinity
    "♻️", // recycling
    "⚙️", // gear (you have)
    "⚒️", // hammer & pick
    "⚗️", // alembic
    "⚕️", // medical
    "⚖️", // balance scale
    "⚔️", // crossed swords
    "⚓", // anchor
    "⚛️", // atom
    "⚡", // lightning bolt
    "⚜️", // fleur-de-lis
    "⛔", // no entry
    "🚫", // prohibited
    "⛪", // church
    "🕋", // kaaba
    "🕍", // synagogue
    "🕌", // mosque
    "🛕", // hindu temple
    "⛩️", // shinto shrine
    "⛏️", // pick
    "🪓", // axe
    "🪝", // hook
    "🪞", // mirror
    "🪠", // plunger
  ],
};

export default function EmojiPicker({ customEmojis = [], onSelect, onClose }) {
  const [selectedCategory, setSelectedCategory] = useState("Smileys");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = ["Custom", ...Object.keys(standardEmojis)];

  const getFilteredEmojis = () => {
    if (selectedCategory === "Custom") {
      if (searchTerm) {
        return customEmojis.filter((emoji) =>
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
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.categories}>
          {categories.map((category) => (
            <button
              key={category}
              className={`${styles.categoryButton} ${
                selectedCategory === category ? styles.active : ""
              }`}
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
