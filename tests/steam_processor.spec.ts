import SteamProcessor from 'src/processors/steam_processor';

describe('Steam processor', () => {
  describe('processing', () => {
    // Lists
    describe('lists', () => {
      test('should parse empty list', () => {
        const sampleText = `[list][/list]`;
        const expected = `<ul></ul>`;

        const processor = new SteamProcessor();
        const actual = processor.process(sampleText);

        expect(actual).toEqual(expected);
      });
      test('should parse empty multiline list', () => {
        const sampleText = `[list]\n\n[/list]`;
        const expected = `<ul></ul>`;

        const processor = new SteamProcessor();
        const actual = processor.process(sampleText);

        expect(actual).toEqual(expected);
      });
      test('should parse sample list', () => {
        const sampleText = `[list]\n[*] Storm Spirit’s Overload lasts until end of round rather than until Storm spirit's next combat.\n[*] Abaddon’s stats changed from 3/6 -> 2/8 \n[*] Abaddon’s Borrowed Time purges Abaddon and may be used when stunned or silenced. Cooldown reduced from 3 -> 2.\n[*] Abaddon’s Mist Coil self-damage reduced from 3 -> 2.\n[*] Corpse Horde is now an After Combat effect and will spread Zombies more sanely when there is a mix of new Zombies and old units to devour.\n[*] Claszureme Hourglass gives +2 Health.\n[*] No Hesitation and Raid can only be used if there is still a combat phase (i.e. there is only one combat phase per lane).\n[*] Axe’s Berserker’s Call, Keefe the Bold’s Stop Hittin’ Yourself, Shadow Fiend’s Requiem of Souls, Bristleback’s Quill Spray, and Nyctasha’s Guard must have valid targets to use.\n[*] Phase Boots and Rebel Decoy require that both units are not rooted.\n[*] Force Staff cannot target rooted units.\n[/list]`;
        const expected = `<ul><li>Storm Spirit’s Overload lasts until end of round rather than until Storm spirit's next combat.</li><li>Abaddon’s stats changed from 3/6 -> 2/8</li><li>Abaddon’s Borrowed Time purges Abaddon and may be used when stunned or silenced. Cooldown reduced from 3 -> 2.</li><li>Abaddon’s Mist Coil self-damage reduced from 3 -> 2.</li><li>Corpse Horde is now an After Combat effect and will spread Zombies more sanely when there is a mix of new Zombies and old units to devour.</li><li>Claszureme Hourglass gives +2 Health.</li><li>No Hesitation and Raid can only be used if there is still a combat phase (i.e. there is only one combat phase per lane).</li><li>Axe’s Berserker’s Call, Keefe the Bold’s Stop Hittin’ Yourself, Shadow Fiend’s Requiem of Souls, Bristleback’s Quill Spray, and Nyctasha’s Guard must have valid targets to use.</li><li>Phase Boots and Rebel Decoy require that both units are not rooted.</li><li>Force Staff cannot target rooted units.</li></ul>`;

        const processor = new SteamProcessor();
        const actual = processor.process(sampleText);

        expect(actual).toEqual(expected);
      });
    });

    test('sample text 01', () => {
      const sampleText = `[i]<a class="bb_link" href="https://steamcommunity.com/linkfilter/?url=https://factorio.com/blog/post/fff-318" target="_blank" rel="noreferrer" >Read this post on our website.</a><span class="bb_link_host">[factorio.com]</span>[/i]<br><br>Hello,<br>we just released 0.17.73, with 0.17.74 coming very soon. This is just some bug fixes and further pathfinding improvements, and we hope to be able to mark the release as Stable next week.<br><br><div class="bb_h1">The new tooltips (Twinsen)</div><br>As part of our big GUI update, I've been working on one particular part: the tooltips. We worked not only on updating the style, but also how the information is structured and sorted, added missing information, removed irrelevant information. This concerns entity, item and recipe tooltips, but almost all tooltips were touched one way or another. Many things were changed. I will go through some of the more important changes. There is also a link [url=https://steamcommunity.com/ogg/593110/announcements/detail/1599264607923965569/]here/[/url/].`;

      const expected = `<i><a class="bb_link" href="https://factorio.com/blog/post/fff-318" target="_blank" rel="noreferrer" >Read this post on our website.</a></i><br><br>Hello,<br>we just released 0.17.73, with 0.17.74 coming very soon. This is just some bug fixes and further pathfinding improvements, and we hope to be able to mark the release as Stable next week.<br><br><h1>The new tooltips (Twinsen)</h1><br>As part of our big GUI update, I've been working on one particular part: the tooltips. We worked not only on updating the style, but also how the information is structured and sorted, added missing information, removed irrelevant information. This concerns entity, item and recipe tooltips, but almost all tooltips were touched one way or another. Many things were changed. I will go through some of the more important changes. There is also a link <a href="https://steamcommunity.com/ogg/593110/announcements/detail/1599264607923965569">here</a>.`;

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // Images
  describe('images', () => {
    test('should parse simple img tag', () => {
      const sampleText = '[img]https://example.com/image.png[/img]';
      const expected = '<p><img src="https://example.com/image.png" alt="Image"/></p>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
    test('should parse img tag with STEAM_CLAN_IMAGE', () => {
      const sampleText = '[img]{STEAM_CLAN_IMAGE}/image.png[/img]';
      const expected =
        '<p><img src="https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/clans/image.png" alt="Image"/></p>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // YouTube previews
  describe('YouTube previews', () => {
    test('should parse simple previewyoutube tag', () => {
      const sampleText = '[previewyoutube=PVNSct9atp8;full][/previewyoutube]';
      const expected = '<p><a href="https://youtu.be/PVNSct9atp8;full">YouTube Video</a></p>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
    test('should parse previewyoutube tag with alt text', () => {
      const sampleText = '[previewyoutube=PVNSct9atp8;full]Alt Text[/previewyoutube]';
      const expected = '<p><a href="https://youtu.be/PVNSct9atp8;full">Alt Text</a></p>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // URLs
  describe('URLs', () => {
    test('should parse simple URL tag', () => {
      const sampleText = '[url=https://github.com]Text[/url]';
      const expected = '<a href="https://github.com">Text</a>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
    test('should parse URL tag without link text', () => {
      const sampleText = '[url=https://github.com][/url]';
      const expected = '<a href="https://github.com">Link</a>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // Bold
  describe('bold', () => {
    test('should parse simple bold tag', () => {
      const sampleText = '[b]Text[/b]';
      const expected = '<b>Text</b>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // Italic
  describe('italic', () => {
    test('should parse simple italic tag', () => {
      const sampleText = '[i]Text[/i]';
      const expected = '<i>Text</i>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // Underline
  describe('underline', () => {
    test('should parse simple underline tag', () => {
      const sampleText = '[u]Text[/u]';
      const expected = '<u>Text</u>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // Strikethrough
  describe('strikethrough', () => {
    test('should parse simple strikethrough tag', () => {
      const sampleText = '[strike]Text[/strike]';
      const expected = '<s>Text</s>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // Header
  describe('header', () => {
    test('should parse simple h1 tag', () => {
      const sampleText = '[h1]Text[/h1]';
      const expected = '<h1>Text</h1>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
    test('should parse simple h2 tag', () => {
      const sampleText = '[h2]Text[/h2]';
      const expected = '<h2>Text</h2>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
    test('should parse simple h3 tag', () => {
      const sampleText = '[h3]Text[/h3]';
      const expected = '<h3>Text</h3>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
    test('should parse simple h4 tag', () => {
      const sampleText = '[h4]Text[/h4]';
      const expected = '<h4>Text</h4>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // Link filter
  describe('link filter', () => {
    test('should remove linkfilters', () => {
      const sampleText =
        '<a href="https://steamcommunity.com/linkfilter/?url=https://github.com">Text</a>';
      const expected = '<a href="https://github.com">Text</a>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // BB Headers
  describe('bb header', () => {
    test('should parse bb h1 header', () => {
      const sampleText = '<div class="bb_h1">Text</div>';
      const expected = '<h1>Text</h1>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
    test('should parse bb h2 header', () => {
      const sampleText = '<div class="bb_h2">Text</div>';
      const expected = '<h2>Text</h2>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
    test('should parse bb h3 header', () => {
      const sampleText = '<div class="bb_h3">Text</div>';
      const expected = '<h3>Text</h3>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
    test('should parse bb h4 header', () => {
      const sampleText = '<div class="bb_h4">Text</div>';
      const expected = '<h4>Text</h4>';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // BB Link Hosts
  describe('bb link host', () => {
    test('should remove bb link hosts', () => {
      const sampleText = '<span class="bb_link_host">[github.com]</span>';
      const expected = '';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // No Parse
  describe('noparse', () => {
    test('should not change normal text', () => {
      const sampleText = '[noparse]Text[/noparse]';
      const expected = 'Text';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
  // Spoiler
  describe('spoiler', () => {
    test('should remove spoiler tag', () => {
      // TODO: Add a proper test once the spoiler tag is supported
      const sampleText = '[spoiler]Text[/spoiler]';
      const expected = 'Text';

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
});
