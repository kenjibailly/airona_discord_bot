import { useState } from "react";
import EmojiPicker from "../EmojiPicker";
import styles from "../../styles/EmbedEditor.module.css";

export default function EmbedEditor({ embedData, setEmbedData, guildId }) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    embed: true,
    author: false,
    body: true,
    fields: false,
    images: false,
    footer: false
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const updateEmbed = (path, value) => {
    setEmbedData(prev => {
      const newData = { ...prev };
      const embed = { ...newData.embeds[0] };
      
      const keys = path.split('.');
      let current = embed;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      newData.embeds[0] = embed;
      
      return newData;
    });
  };

  const hexToDecimal = (hex) => {
    return parseInt(hex.replace('#', ''), 16);
  };

  const decimalToHex = (decimal) => {
    return '#' + decimal.toString(16).padStart(6, '0');
  };

  const addField = () => {
    const embed = embedData.embeds[0];
    const newFields = [...(embed.fields || []), { name: "Field name", value: "Field value", inline: false }];
    updateEmbed('fields', newFields);
  };

  const removeField = (index) => {
    const embed = embedData.embeds[0];
    const newFields = embed.fields.filter((_, i) => i !== index);
    updateEmbed('fields', newFields);
  };

  const updateField = (index, key, value) => {
    const embed = embedData.embeds[0];
    const newFields = [...embed.fields];
    newFields[index] = { ...newFields[index], [key]: value };
    updateEmbed('fields', newFields);
  };

  const addImageToGallery = () => {
    const embed = embedData.embeds[0];
    const newImages = [...(embed.images || []), { url: "" }];
    updateEmbed('images', newImages);
  };

  const removeImageFromGallery = (index) => {
    const embed = embedData.embeds[0];
    const newImages = embed.images.filter((_, i) => i !== index);
    updateEmbed('images', newImages);
  };

  const updateGalleryImage = (index, value) => {
    const embed = embedData.embeds[0];
    const newImages = [...embed.images];
    newImages[index] = { url: value };
    updateEmbed('images', newImages);
  };

  const addEmbed = () => {
    setEmbedData(prev => ({
      ...prev,
      embeds: [
        ...prev.embeds,
        {
          author: { name: "", url: "", icon_url: "" },
          title: "",
          url: "",
          description: "",
          color: 5814783,
          fields: [],
          thumbnail: { url: "" },
          image: { url: "" },
          images: [],
          footer: { text: "", icon_url: "" },
          timestamp: ""
        }
      ]
    }));
  };

  const addLinkButton = () => {
    setEmbedData(prev => ({
      ...prev,
      components: [
        ...prev.components,
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 5,
              label: "Button label",
              url: "https://example.com",
              emoji: null
            }
          ]
        }
      ]
    }));
  };

  const updateButton = (rowIndex, buttonIndex, key, value) => {
    setEmbedData(prev => {
      const newComponents = [...prev.components];
      newComponents[rowIndex].components[buttonIndex] = {
        ...newComponents[rowIndex].components[buttonIndex],
        [key]: value
      };
      return { ...prev, components: newComponents };
    });
  };

  const removeButton = (rowIndex, buttonIndex) => {
    setEmbedData(prev => {
      const newComponents = [...prev.components];
      newComponents[rowIndex].components.splice(buttonIndex, 1);
      if (newComponents[rowIndex].components.length === 0) {
        newComponents.splice(rowIndex, 1);
      }
      return { ...prev, components: newComponents };
    });
  };

  const embed = embedData.embeds[0];

  return (
    <div className={styles.editor}>
      {/* Content */}
      <div className={styles.section}>
        <label>Content</label>
        <textarea
          value={embedData.content}
          onChange={(e) => setEmbedData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Message content (outside embed)"
          rows={3}
        />
      </div>

      {/* Embed */}
      <div className={styles.collapsible}>
        <div className={styles.header} onClick={() => toggleSection('embed')}>
          <span>{expandedSections.embed ? '▼' : '▶'} Embed</span>
        </div>
        
        {expandedSections.embed && (
          <div className={styles.content}>
            {/* Author */}
            <div className={styles.collapsible}>
              <div className={styles.header} onClick={() => toggleSection('author')}>
                <span>{expandedSections.author ? '▼' : '▶'} Author</span>
              </div>
              
              {expandedSections.author && (
                <div className={styles.content}>
                  <div className={styles.fieldWithButton}>
                    <div className={styles.field}>
                      <label>Name <span className={styles.charCount}>{embed.author?.name?.length || 0}/256</span></label>
                      <input
                        type="text"
                        value={embed.author?.name || ""}
                        onChange={(e) => updateEmbed('author.name', e.target.value)}
                        maxLength={256}
                        placeholder="Author name"
                      />
                    </div>
                    <button
                      className={styles.addUrlButton}
                      onClick={() => {
                        const hasUrl = embed.author?.url;
                        if (!hasUrl) {
                          updateEmbed('author.url', 'https://');
                        } else {
                          updateEmbed('author.url', '');
                        }
                      }}
                    >
                      {embed.author?.url ? '✕' : '🔗'}
                    </button>
                  </div>

                  {embed.author?.url && (
                    <div className={styles.field}>
                      <label>Author URL</label>
                      <input
                        type="url"
                        value={embed.author.url}
                        onChange={(e) => updateEmbed('author.url', e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                  )}

                  <div className={styles.field}>
                    <label>Icon URL</label>
                    <input
                      type="url"
                      value={embed.author?.icon_url || ""}
                      onChange={(e) => updateEmbed('author.icon_url', e.target.value)}
                      placeholder="https://example.com/icon.png"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Body */}
            <div className={styles.collapsible}>
              <div className={styles.header} onClick={() => toggleSection('body')}>
                <span>{expandedSections.body ? '▼' : '▶'} Body</span>
              </div>
              
              {expandedSections.body && (
                <div className={styles.content}>
                  <div className={styles.fieldWithButton}>
                    <div className={styles.field}>
                      <label>Title <span className={styles.charCount}>{embed.title?.length || 0}/256</span></label>
                      <input
                        type="text"
                        value={embed.title || ""}
                        onChange={(e) => updateEmbed('title', e.target.value)}
                        maxLength={256}
                        placeholder="Embed title"
                      />
                    </div>
                    <button
                      className={styles.addUrlButton}
                      onClick={() => {
                        const hasUrl = embed.url;
                        if (!hasUrl) {
                          updateEmbed('url', 'https://');
                        } else {
                          updateEmbed('url', '');
                        }
                      }}
                    >
                      {embed.url ? '✕' : '🔗'}
                    </button>
                  </div>

                  {embed.url && (
                    <div className={styles.field}>
                      <label>Title URL</label>
                      <input
                        type="url"
                        value={embed.url}
                        onChange={(e) => updateEmbed('url', e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                  )}

                  <div className={styles.fieldWithButton}>
                    <div className={styles.field}>
                      <label>Sidebar Color</label>
                      <input
                        type="text"
                        value={decimalToHex(embed.color || 0)}
                        onChange={(e) => {
                          const hex = e.target.value;
                          if (/^#[0-9A-F]{6}$/i.test(hex)) {
                            updateEmbed('color', hexToDecimal(hex));
                          }
                        }}
                        placeholder="#58b9ff"
                      />
                    </div>
                    <button
                      className={styles.colorPickerButton}
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    >
                      🎨
                    </button>
                  </div>

                  {showColorPicker && (
                    <input
                      type="color"
                      value={decimalToHex(embed.color || 0)}
                      onChange={(e) => updateEmbed('color', hexToDecimal(e.target.value))}
                      className={styles.colorPicker}
                    />
                  )}

                  <div className={styles.field}>
                    <label>Description <span className={styles.charCount}>{embed.description?.length || 0}/4096</span></label>
                    <textarea
                      value={embed.description || ""}
                      onChange={(e) => updateEmbed('description', e.target.value)}
                      maxLength={4096}
                      rows={6}
                      placeholder="Embed description"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Fields */}
            <div className={styles.collapsible}>
              <div className={styles.header} onClick={() => toggleSection('fields')}>
                <span>{expandedSections.fields ? '▼' : '▶'} Fields</span>
              </div>
              
              {expandedSections.fields && (
                <div className={styles.content}>
                  {(embed.fields || []).map((field, index) => (
                    <div key={index} className={styles.collapsible}>
                      <div className={styles.header}>
                        <span>Field {index + 1}</span>
                        <button
                          className={styles.trashButton}
                          onClick={() => removeField(index)}
                        >
                          🗑️
                        </button>
                      </div>
                      <div className={styles.content}>
                        <div className={styles.fieldWithCheckbox}>
                          <div className={styles.field}>
                            <label>Name <span className={styles.charCount}>{field.name?.length || 0}/256</span></label>
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => updateField(index, 'name', e.target.value)}
                              maxLength={256}
                              placeholder="Field name"
                            />
                          </div>
                          <label className={styles.inlineCheckbox}>
                            <input
                              type="checkbox"
                              checked={field.inline || false}
                              onChange={(e) => updateField(index, 'inline', e.target.checked)}
                            />
                            Inline
                          </label>
                        </div>

                        <div className={styles.field}>
                          <label>Value <span className={styles.charCount}>{field.value?.length || 0}/1024</span></label>
                          <textarea
                            value={field.value}
                            onChange={(e) => updateField(index, 'value', e.target.value)}
                            maxLength={1024}
                            rows={3}
                            placeholder="Field value"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button className={styles.addButton} onClick={addField}>
                    + Add Field
                  </button>
                </div>
              )}
            </div>

            {/* Images */}
            <div className={styles.collapsible}>
                <div className={styles.header} onClick={() => toggleSection('images')}>
                    <span>{expandedSections.images ? '▼' : '▶'} Images</span>
                </div>
                
                {expandedSections.images && (
                    <div className={styles.content}>
                    <div className={styles.field}>
                        <label>Image URL</label>
                        <input
                        type="url"
                        value={embed.image?.url || ""}
                        onChange={(e) => updateEmbed('image.url', e.target.value)}
                        placeholder="https://example.com/image.png"
                        />
                        <small>Single large image displayed in the embed</small>
                    </div>

                    <div className={styles.field}>
                        <label>Thumbnail URL</label>
                        <input
                        type="url"
                        value={embed.thumbnail?.url || ""}
                        onChange={(e) => updateEmbed('thumbnail.url', e.target.value)}
                        placeholder="https://example.com/thumbnail.png"
                        />
                        <small>Small image displayed in the top right corner</small>
                    </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className={styles.collapsible}>
              <div className={styles.header} onClick={() => toggleSection('footer')}>
                <span>{expandedSections.footer ? '▼' : '▶'} Footer</span>
              </div>
              
              {expandedSections.footer && (
                <div className={styles.content}>
                  <div className={styles.field}>
                    <label>Text <span className={styles.charCount}>{embed.footer?.text?.length || 0}/2048</span></label>
                    <textarea
                      value={embed.footer?.text || ""}
                      onChange={(e) => updateEmbed('footer.text', e.target.value)}
                      maxLength={2048}
                      rows={3}
                      placeholder="Footer text"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Icon URL</label>
                    <input
                      type="url"
                      value={embed.footer?.icon_url || ""}
                      onChange={(e) => updateEmbed('footer.icon_url', e.target.value)}
                      placeholder="https://example.com/icon.png"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Timestamp</label>
                    <input
                      type="datetime-local"
                      value={embed.timestamp ? new Date(embed.timestamp).toISOString().slice(0, 16) : ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          updateEmbed('timestamp', new Date(e.target.value).toISOString());
                        } else {
                          updateEmbed('timestamp', '');
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Menu */}
      <div className={styles.addMenu}>
        <div className={styles.menuLabel}>Add</div>
        <button className={styles.menuButton} onClick={addEmbed}>
          + Embed
        </button>
        <button className={styles.menuButton} onClick={addLinkButton}>
          + Link Button
        </button>
      </div>

      {/* Components (Buttons) */}
      {embedData.components.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.componentRow}>
          {row.components.map((button, buttonIndex) => (
            <div key={buttonIndex} className={styles.buttonComponent}>
              <div className={styles.componentHeader}>
                <span>Link Button {buttonIndex + 1}</span>
                <button
                  className={styles.trashButton}
                  onClick={() => removeButton(rowIndex, buttonIndex)}
                >
                  🗑️
                </button>
              </div>

              <div className={styles.field}>
                <label>Label <span className={styles.charCount}>{button.label?.length || 0}/80</span></label>
                <input
                  type="text"
                  value={button.label}
                  onChange={(e) => updateButton(rowIndex, buttonIndex, 'label', e.target.value)}
                  maxLength={80}
                  placeholder="Button label"
                />
              </div>

              <div className={styles.field}>
                <label>URL</label>
                <input
                  type="url"
                  value={button.url}
                  onChange={(e) => updateButton(rowIndex, buttonIndex, 'url', e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <div className={styles.field}>
                <label>Emoji (optional)</label>
                <button
                  className={styles.emojiButton}
                  onClick={() => setShowEmojiPicker(showEmojiPicker === `${rowIndex}-${buttonIndex}` ? null : `${rowIndex}-${buttonIndex}`)}
                >
                  {button.emoji ? (button.emoji.id ? `<:${button.emoji.name}:${button.emoji.id}>` : button.emoji.name) : "Select Emoji"}
                </button>
                
                {showEmojiPicker === `${rowIndex}-${buttonIndex}` && (
                  <EmojiPicker
                    customEmojis={[]}
                    onSelect={(emoji) => {
                      if (emoji.id) {
                        updateButton(rowIndex, buttonIndex, 'emoji', { id: emoji.id, name: emoji.name });
                      } else {
                        updateButton(rowIndex, buttonIndex, 'emoji', { name: emoji.native });
                      }
                      setShowEmojiPicker(null);
                    }}
                    onClose={() => setShowEmojiPicker(null)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}