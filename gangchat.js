// ==UserScript==
// @name        Legacy Gang Chat
// @description Gang Only Chat Channel for Legacy Game
// @include     https://www.legacy-game.net/*
// @include     https://dev.legacy-game.net/*
// @grant       none
// @require     http://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.1/jquery.js
// ==/UserScript==

// Avoid conflicting with page's jQuery
this.$ = this.jQuery = jQuery.noConflict(true);

/**
 * Global Vars
 */

var host = {
	whole: $(window)[0].origin,
	path: window.location.pathname,
};

var $head = $("head"),
	$body = $("body");

/**
 * Custom CSS and Font
 */

// Add Custom Stylesheet
$head.append('<style type="text/css" id="css-tampermonkey"></style>');

// Add to custom stylesheet via $.tamperCSS()
$.extend({
	tamperCSS: function(style_rule, path_rules = [".*"]) {
		$.each(path_rules, function(i, pathname) {
			if (host.path.match(pathname)) {
				if (typeof style_rule === "string") {
					$("#css-tampermonkey").append(style_rule);
				} else if (
					typeof style_rule === "array" ||
					typeof style_rule === "object"
				) {
					$.each(style_rule, function(i, v) {
						$("#css-tampermonkey").append(v);
					});
				}
			}
		});
	},
});

$.tamperCSS([
	":root{--accent-color:" + $(".colortext").css("color") + "}",
	"::-webkit-scrollbar {width:20px}",
	"::-webkit-scrollbar-track, *:not(body)::-webkit-resizer{box-shadow: inset 0 0 5px grey;border-radius: 10px;}",
	'::-webkit-scrollbar-thumb {background: rgb(0,0,0);background: -moz-linear-gradient(90deg, rgba(0,0,0,1) 0%, var(--accent-color) 50%, rgba(0,0,0,1) 100%);background: -webkit-linear-gradient(90deg, rgba(0,0,0,1) 0%, var(--accent-color) 50%, rgba(0,0,0,1) 100%);background: linear-gradient(90deg, rgba(0,0,0,1) 0%, var(--accent-color) 50%, rgba(0,0,0,1) 100%);filter: progid:DXImageTransform.Microsoft.gradient(startColorstr="#000000",endColorstr="#000000",GradientType=1);border-radius: 10px;}',
	"#gangchat::-webkit-scrollbar{width:8px}",
	"*:not(body)::-webkit-scrollbar{width:12px}",
	"*:not(body)::-webkit-scrollbar-track, *:not(body)::-webkit-scrollbar-thumb {border-radius:0}",
]);

// Add Custom Font
$head.append(
	'<link href="https://fonts.googleapis.com/css?family=Aldrich" rel="stylesheet">'
);

/**
 * Emoticon Focus
 * --------------
 * Insert emoticons in to last focused textarea or text input
 * This includes war chat, messages, side chat, and will add the
 * emoji insertion at the end of the input with a trailing space
 */
$("#sc-show-emoticons")
	.removeAttr("onclick")
	.click(function() {
		tamperDisplayEmoticons();
	});

var lastFocusedInput = null;

function updateFocused(jqueryObj) {
	lastFocusedInput = jqueryObj;
}

// Allow to reset and add more when more inputs are added
function updateFocusListener() {
	$('input[type="text"], textarea')
		.off()
		.on("focus", function() {
			updateFocused($(this));
		});
}

function tamperInsertEmoticon(emoticon) {
	lastFocusedInput = lastFocusedInput || $("#chattext");
	lastFocusedInput.val(lastFocusedInput.val() + emoticon + " ");
	lastFocusedInput.focus();
}

// Utilize the established Emote container
function tamperDisplayEmoticons() {
	var emoticonsContainer = $("#emoticons-container");

	if (!$body.hasClass("processed-emoticon-container-click-listener")) {
		emoticonsContainer.load("sidechat_emoticons.php", function() {
			$body.click(function(e) {
				if (emoticonsContainer.is(":visible")) {
					emoticonsContainer.toggle("fast");
				}
			});

			$body.addClass("processed-emoticon-container-click-listener");

			var emotes = $("#emoticons-container img[onclick]");

			$.each(emotes, function(i, v) {
				var emote = $(this),
					click = emote.attr("onclick");

				click = click.replace(/(InsertEmoticonSC\(')(.*)('\);?)/, "$2");

				$(this)
					.removeAttr("onclick")
					.attr("data-emote", click);
			});

			emotes.click(function() {
				tamperInsertEmoticon($(this).data("emote"));
			});
		});
	}

	// Toggle visibility
	window.setTimeout(function() {
		emoticonsContainer.stop(true).toggle("fast");
	});
}

/**
 * Gang Chat Channel
 * -----------------
 * Adds a 'gang only' chat mimicking the styling of side chat.
 * Gang Chat will utilize Legacy's established Chat Channel system,
 * and updates in psuedo real-time. Similar to the war/side chat
 * system, the chat sends a request on scheduled interval, however
 * it updates when receiving new information.
 *
 * Features
 * --------
 * Flood Filter Indicator. At the time of this
 * submission, the chat will allow you to submit chat entries even
 * when at maximum allowance. From my understand of Legacy behavior,
 * the chat submission will be refused and not fully submitted.
 *
 * Emoji Insertion. Legacy's emoticon insertion system has been
 * modified to allow the last focused text input to receive the
 * emoji code. When clicking on the Gang Chat's emoticon insertion
 * icon, it will use side chat's emoticon container, however, the
 * emoji code will be inserted into Gang Chat's text input.
 *
 * History Retention. When submitting a chat entry, the text will
 * be appended to a history collection that can be recycled by
 * pressing the up and down arrows while focused on the text input.
 * This history is erased when the page session ends but will
 * carry through to the next page load.
 *
 * Scroll Position Retention. When scrolling through chat history,
 * (on a slight delay) the chat will record the positioning of the
 * scroll. Should the page refresh, the chat will maintain the
 * position and on loading of the page, return to this position.
 *
 * Input Text Retention. When typing in the text input, (on a
 * slight delay) the chat will record the text currently written.
 * Should the page refresh, the chat will preload the saved text
 * once the chat loads.
 *
 * Scroll To Bottom. Any time the chat is not completely scrolled
 * to the bottom most position, the chat offers an icon to click
 * to speed scroll to the bottom.
 *
 * No Scroll While Combing. While scrolling through the history,
 * the chat will recognize that the positioning is not at the bottom.
 * The chat behavior will maintain this position even if new entries
 * from other gang members are submitted. If you submit new chat
 * entries, the chat will force scroll to the bottom.
 *
 * View Chat Users. The indicator (1) next to the "View Chat Users"
 * text is a count of the current gang members in the chat channel.
 * This updates in psuedo real-time. When hovering over the text,
 * a list of current users with levels will pop up. The text are
 * links to their profiles.
 */

// Start Gang Chat
$(document).ready(function() {
	gangChat.init();
});

var gangChat = {
	init: function() {
		var self = this;

		// Setup frame work for chat
		self.chatFrame();

		// Configuration
		self.config = {
			chatLimit: 50,
			timeoutIncrement: 500,
			minTimeout: 1000,
			maxTimeout: 7500,
			scrollTimeout: 800,
			saveTimeout: 500,
		};

		// Init
		self.initializing = true;
		self.submission = false;
		self.currentChannel = "gang2";
		self.channels = {};

		// Current Text Input Vitals
		self.currentEntry = {
			key: "gangchatInput",
			timeout: undefined,
		};

		// Current Entry Submission History Vitals
		self.history = {
			key: "gangchatHistory",
			max: 15,
			pos: 0,
			text: [],
		};

		// Scroll History Position Vitals
		self.scroll = {
			key: "gangchatScroll",
			pos: 0,
			btm: 0,
			timeout: undefined,
		};

		// Chat limit Init
		self.updateChatLimit();

		// Init 'general' channel
		// Has to be done to retrieve gang chat
		self.channels["general"] = {
			lastId: 0,
		};

		// Init 'gang' channel
		self.channels["gang2"] = {
			lastId: 0,
			diffId: 0,
			chat: [],
			users: [],
		};

		// Runtime Vitals
		self.output = [];
		self.token = token;
		self.chatTimeout = undefined;
		self.seconds = self.config.minTimeout;

		// Init fetcher for chat
		self.chatLoop();

		var chatInput = $("#gangchatText"),
			chatSend = $("#gangchatSend");

		// On scroll position save
		$("#gangchat").scroll(function(e) {
			(self.scroll.pos = $(this).scrollTop()),
				(height = $(this).outerHeight());

			// Scroll To Bottom Button visibility toggle
			if (Math.ceil(self.scroll.pos + height) < self.scroll.btm) {
				$("#scrollBottom").fadeIn(500);
			} else {
				$("#scrollBottom").fadeOut(200);
			}

			clearTimeout(self.scroll.timeout);

			self.scroll.timeout = setTimeout(function() {
				sessionStorage.setItem(self.scroll.key, self.scroll.pos);
			}, self.config.scrollTimeout);
		});

		// Scroll To Bottom Button
		$("#scrollBottom").click(function() {
			$("#gangchat").animate({ scrollTop: self.scroll.btm }, 300);
		});

		// Input Listener
		chatInput.on("keydown keyup", function(e) {
			switch (e.type) {
				case "keydown":
					// Preload prior entry submission
					// Which = up arrow
					if (e.keyCode == 38) {
						e.preventDefault();

						self.history.pos--;

						// Prevent less than 0
						if (self.history.pos < 0) {
							self.history.pos = 0;
						}

						$(this).val(self.history.text[self.history.pos]);
					}
					// Which = down arrow
					else if (e.keyCode == 40) {
						e.preventDefault();

						self.history.pos++;

						// Prevent greater than history length
						if (self.history.pos > self.history.text.length) {
							self.history.pos = self.history.text.length;
						}

						// Preload prior entry
						if (self.history.pos < self.history.text.length) {
							$(this).val(self.history.text[self.history.pos]);
						}
						// At end of history, clear text
						else if (self.history.pos == self.history.text.length) {
							$(this).val("");
						}
					}
					break;

				case "keyup":
					// On 'Enter' send chat
					if (e.keyCode == 13) {
						chatSend.click();

						e.preventDefault();

						// Remove current text preservation
						sessionStorage.setItem(self.currentEntry.key, "");
					} else if (e.keyCode != 38 && e.keyCode != 40) {
						// Preserve text for when page refreshes
						clearTimeout(self.currentEntry.timeout);

						// Save text on delay for fast typers
						self.currentEntry.timeout = setTimeout(function() {
							sessionStorage.setItem(
								self.currentEntry.key,
								chatInput.val()
							);
						}, self.config.saveTimeout);
					}
					break;
			}
		});

		// Commence the chat, clear text box
		chatSend.click(function() {
			self.send(chatInput.val());
			chatInput.val("");
		});

		// Preload input text save
		chatInput.val(sessionStorage.getItem(self.currentEntry.key));

		// Aim emoji insertion into gang chat
		$("#gangchatShowEmo").click(function() {
			tamperDisplayEmoticons();
			updateFocused($("#gangchatText"));
		});

		// Reset timeout when focusing on gang chat
		$("#gangchatText").focus(function() {
			self.resetTimeout();
		});

		// Gather prior history
		var temp =
			sessionStorage.getItem(this.history.key) !== null
				? sessionStorage.getItem(this.history.key).split(";")
				: [];

		$.each(temp, function(i, encoded) {
			self.history.text[i] = decodeURIComponent(encoded);
		});

		// Initially put history at the end
		this.history.pos = this.history.text.length;
	},
	chatLoop: function() {
		var doing_request,
			self = this,
			postData = {
				token: self.token,
				channel: "gang2",
			};

		// Add channel IDs for request
		$.each(self.channels, function(k, d) {
			postData[k + "_id"] = d.lastId;
		});

		// Entry Submission
		if (self.output.length > 0) {
			postData.chat = self.output.shift();
		}

		// Prevent request stacking
		if (doing_request === true) {
			return;
		}
		doing_request = true;

		// Request for chat info
		$.ajax("chat.php", {
			type: "POST",
			data: postData,
			dataType: "json",
			error: function() {
				self.timeout = setTimeout(function() {
					self.chatLoop();
				}, self.seconds);
			},
			success: function(data) {
				self.chatServerResponse(data);
			},
		}).always(function() {
			// When done, allow for next loop
			doing_request = false;
		});
	},
	chatServerResponse: function(data) {
		var self = this;

		// Spam bar
		self.updateChatLimit(data.chatLimit);

		// Future Update...
		if (typeof data.success !== "undefined") {
			/* 			var successContainer = $('#chat-success');

			// Do not allow successes to stack.
			if(successContainer.is(":visible")) {
				return;
			}

			successContainer.html('<span>Success:</span> ' + data.success).fadeIn("fast").delay(5000).fadeOut("fast");
 */
		} else if (data.error !== false) {
			if (data.error == "reload") {
				window.location.reload();
				return;
			}

			/* 			var errorContainer = $('#chat-error');

			// Do not allow errors to stack.
			if(errorContainer.is(":visible")) {
				return;
			}

			errorContainer.html('<span>Error:</span> ' + data.error).fadeIn("fast").delay(5000).fadeOut("fast");
 */
		} else {
			var newEntry = false;

			// Update Channels
			for (var channel in data.channels) {
				// Set ID to latest for general so we dont request more than we care to receive
				if (channel == "general") {
					self.channels[channel].lastId =
						data.channels[channel].lastId;
				} else {
					// Update Users
					self.channels.gang2.users = data.channels.gang2.users;
					self.updateUsers();

					// Difference of newest ID to last one recorded
					self.channels[channel].diffId =
						data.channels[channel].lastId -
						self.channels[channel].lastId;

					if (self.channels[channel].diffId > self.config.chatLimit) {
						self.channels[channel].diffId = self.config.chatLimit;
					}

					// When we have new chat entry IDs
					if (self.channels[channel].diffId > 0) {
						newEntry = true;

						self.channels[channel].lastId =
							data.channels[channel].lastId;

						// Add new chat entries to the chat array, take off extras
						for (
							var i = 0;
							i < data.channels[channel].chat.length;
							i++
						) {
							self.channels[channel].chat.push(
								data.channels[channel].chat[i]
							);

							if (
								self.channels[channel].chat.length >
								self.config.chatLimit
							) {
								self.channels[channel].chat.shift();
							}
						}
					}
				}
			}

			// When new entries found, update the chat
			if (newEntry) {
				self.updateChat();
				self.resetTimeout();
			} else {
				self.increaseTimeout();
			}
		}

		// Run loop
		this.chatTimeout = setTimeout(function() {
			self.chatLoop();
		}, self.seconds);
	},
	send: function(text) {
		var self = this;

		clearTimeout(self.chatTimeout);

		// Add submission to history
		self.history.text.push(text);

		// When maxing out history
		if (self.history.text.length > self.history.max) {
			self.history.text.shift();
		}

		// Reset history position back to the end
		self.history.pos = self.history.text.length;

		// Preserve history
		var preserve = [];

		$.each(self.history.text, function(i, text) {
			preserve.push(encodeURIComponent(text));
		});

		sessionStorage.setItem(self.history.key, preserve.join(";"));

		// Add submission to output for POST data
		self.output.push(text);

		self.submission = true;

		self.chatLoop();
	},
	updateChat: function() {
		var self = this,
			chatBox = $("#gangchat");

		// When updating existing entries, remove old
		if (!self.initializing) {
			for (var i = 0; i < self.channels.gang2.diffId; i++) {
				chatBox
					.find(".chatentry")
					.first()
					.remove();
			}
		}

		// Find the additions to add on
		var i = self.channels.gang2.chat.length - self.channels.gang2.diffId;

		for (i; i < self.channels.gang2.chat.length; i++) {
			var entry = self.channels.gang2.chat[i];

			if (entry.account.length == 0) {
				// For use of /me <action>
				chatBox.append(
					'<div class="chatentry"><font class="chattext">' +
						entry.chat +
						"</font></div>"
				);
			} else {
				// Regular chat entries
				var chat = entry.chat.replace(
					new RegExp(account, "gi"),
					'<span class="oktext">' + account + "</span>"
				);

				chatBox.append(
					'<div class="chatentry">' +
						'<font class="colortext chatdata"><b><a href="https://www.legacy-game.net/profile.php?p=' +
						entry.account +
						'">' +
						entry.account +
						"</a></b> : " +
						entry.sentTs +
						"</font>" +
						'<font class="chattext">' +
						chat +
						"</font></div>"
				);
			}
		}

		self.scroll.btm = chatBox.prop("scrollHeight");

		// Scroll to position
		var scrollTo = self.initializing
			? sessionStorage.getItem(self.scroll.key)
			: self.scroll.btm;

		// Scroll To Bottom Button to fade in when initially at top
		if (scrollTo == 0 && self.initializing) {
			chatBox.scroll();
		}

		// Scroll when init or submitting
		if (
			self.initializing ||
			self.submission ||
			!$("#scrollBottom").is(":visible")
		) {
			if (scrollTo === null) {
				chatBox.scrollTop(self.scroll.btm);
			} else {
				chatBox.scrollTop(scrollTo);
			}
		}

		self.initializing = false;
		self.submission = false;
	},
	// Updated List of Users in Gang Chat
	updateUsers: function() {
		var self = this,
			userList = $("#gangchatUsers");

		userList.empty();

		$.each(self.channels.gang2.users, function(i, user) {
			if (user.account !== "System") {
				userList.append(
					'<li><a href="https://www.legacy-game.net/profile.php?p=' +
						user.account +
						'">' +
						user.level +
						"  " +
						user.account +
						"</a></li>"
				);
			}
		});

		$("#userCount").html(self.channels.gang2.users.length - 1);
	},
	chatFrame: function() {
		var rightBar = $(".content-right"),
			sidebox =
				'<div class="sidebox" id="gangChatSidebox"><span id="scrollBottom"></span></div>',
			header = '<div class="sidebox-header">Dark Flame Chat</div>',
			chatbox = '<div class="sidebox-chat gangchat" id="gangchat"></div>',
			footer1 = '<div class="sidebox-footer1"></div>',
			footer2 =
				'<div class="sidebox-footer2" id="gangchatViewUsers">View Chat Users (<span id="userCount">1</span>)<ul id="gangchatUsers"></ul></div>';

		rightBar.append(sidebox);

		$("#gangChatSidebox").append(header + chatbox + footer1 + footer2);

		var chatInput =
				'<input id="gangchatText" name="gangchat" class="chatbox" type="text" maxlength="256" autocomplete="off">',
			chatBtn =
				'<input class="chatbutton" type="button" id="gangchatSend" value=">"><br>',
			chatBar =
				'<img id="gangchatBar" src="img-bin/chatbar0.gif" class="chatbar">',
			chatEmo =
				'<img src="/img-bin/emoticons/open-emoticons.png" id="gangchatShowEmo">';

		$("#gangChatSidebox > .sidebox-footer1").append(
			chatInput + chatBtn + chatBar + chatEmo
		);

		// CSS adjustments for chat box
		$.tamperCSS([
			'#gangchat{overflow-y:scroll;overflow-x:hidden;word-break:break-word;background-image:url("https://wiki.legacy-game.net/images/a/ac/DFLogoTransparent.png");background-position:center center;background-repeat:no-repeat;background-size:contain;background-color:rgba(0,0,0,1);}',
			"#gangchat .chatentry:last-of-type{margin-bottom:15px}",
			'#gangchatUsers{max-height:0;width:100%;margin:0;padding:0;list-style:none;font-family:"Aldrich";overflow:hidden;position:absolute;bottom:0;left:0;display:block;background-color:black;border-top:solid #333 thin;z-index:101;-webkit-transition:all 0.4s ease-out 0.4s;-moz-transition:all 0.4s ease-out 0.4s;-ms-transition:all 0.4s ease-out 0.4s;-o-transition:all 0.4s ease-out 0.4s;transition:all 0.4s ease-out 0.4s;}',
			"#gangchatViewUsers{cursor:default;position:relative}",
			"#gangchatViewUsers:hover > #gangchatUsers{max-height:500px;}",
			"#gangchatUsers > li:first-of-type{margin-top:10px}",
			"#gangchatUsers > li:last-of-type{margin-bottom:10px}",
			"#gangchatUsers > li{margin:3px 0;}",
			"#gangchatShowEmo{position:relative;top:3px;left:4px;width:14px;cursor:pointer;}",
			".chattext{display:block}",
			"span#scrollBottom{display:none;padding:0 8px;position:absolute;bottom:110px;right:15px;float:right;background-color:var(--accent-color);border-radius:50px;color:#AAA;font-size:20pt;cursor:pointer;background:var(--accent-color);background:-moz-radial-gradient(circle, var(--accent-color) 0%, rgba(0,0,0,1) 80%);background:-webkit-radial-gradient(circle, var(--accent-color) 0%, rgba(0,0,0,1) 80%);background:radial-gradient(circle, var(--accent-color) 0%, rgba(0,0,0,1) 80%);}",
			'span#scrollBottom::before{content:"&darr;"}',
			".emoticon{width:auto}",
		]);

		// Emoji Help
		updateFocusListener();
	},
	updateChatLimit: function(limit = 0) {
		// Updates visual chat spam limit indicator
		$("#gangchatBar").attr("src", "img-bin/chatbar" + limit + ".gif");

		// Prevent submission, flood filter
	},
	resetTimeout: function() {
		this.seconds = this.config.minTimeout;
	},
	increaseTimeout: function() {
		this.seconds += this.config.timeoutIncrement;
		if (this.seconds > this.config.maxTimeout) {
			this.seconds = this.config.maxTimeout;
		}
	},
};
