# Legacy Gang Chat

Features
--------
 Flood Filter Indicator. At the time of this
 submission, the chat will allow you to submit chat entries even
 when at maximum allowance. From my understand of Legacy behavior,
 the chat submission will be refused and not fully submitted.
 
 Emoji Insertion. Legacy's emoticon insertion system has been
 modified to allow the last focused text input to receive the
 emoji code. When clicking on the Gang Chat's emoticon insertion
 icon, it will use side chat's emoticon container, however, the
 emoji code will be inserted into Gang Chat's text input.
 
 History Retention. When submitting a chat entry, the text will
 be appended to a history collection that can be recycled by
 pressing the up and down arrows while focused on the text input.
 This history is erased when the page session ends but will
 carry through to the next page load.
 
 Scroll Position Retention. When scrolling through chat history,
 (on a slight delay) the chat will record the positioning of the
 scroll. Should the page refresh, the chat will maintain the
 position and on loading of the page, return to this position.
 
 Input Text Retention. When typing in the text input, (on a
 slight delay) the chat will record the text currently written.
 Should the page refresh, the chat will preload the saved text
 once the chat loads.
 
 Scroll To Bottom. Any time the chat is not completely scrolled
 to the bottom most position, the chat offers an icon to click
 to speed scroll to the bottom.
 
 No Scroll While Combing. While scrolling through the history,
 the chat will recognize that the positioning is not at the bottom.
 The chat behavior will maintain this position even if new entries
 from other gang members are submitted. If you submit new chat
 entries, the chat will force scroll to the bottom.
 
 View Chat Users. The indicator (1) next to the "View Chat Users"
 text is a count of the current gang members in the chat channel.
 This updates in psuedo real-time. When hovering over the text,
 a list of current users with levels will pop up. The text are
 links to their profiles.