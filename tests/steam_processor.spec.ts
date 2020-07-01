import SteamProcessor from '../src/processors/steam_processor';

describe('Steam processor', () => {
  describe('processing', () => {
    test('sample text 01', () => {
      const sampleText = `[i]<a class="bb_link" href="https://steamcommunity.com/linkfilter/?url=https://factorio.com/blog/post/fff-318" target="_blank" rel="noreferrer" >Read this post on our website.</a><span class="bb_link_host">[factorio.com]</span>[/i]<br><br>Hello,<br>we just released 0.17.73, with 0.17.74 coming very soon. This is just some bug fixes and further pathfinding improvements, and we hope to be able to mark the release as Stable next week.<br><br><div class="bb_h1">The new tooltips (Twinsen)</div><br>As part of our big GUI update, I've been working on one particular part: the tooltips. We worked not only on updating the style, but also how the information is structured and sorted, added missing information, removed irrelevant information. This concerns entity, item and recipe tooltips, but almost all tooltips were touched one way or another. Many things were changed. I will go through some of the more important changes. There is also a link [url=https://steamcommunity.com/ogg/593110/announcements/detail/1599264607923965569/]here/[/url/].`;

      const expected = `<i><a class="bb_link" href="https://factorio.com/blog/post/fff-318" target="_blank" rel="noreferrer" >Read this post on our website.</a></i><br><br>Hello,<br>we just released 0.17.73, with 0.17.74 coming very soon. This is just some bug fixes and further pathfinding improvements, and we hope to be able to mark the release as Stable next week.<br><br><h1>The new tooltips (Twinsen)</h1><br>As part of our big GUI update, I've been working on one particular part: the tooltips. We worked not only on updating the style, but also how the information is structured and sorted, added missing information, removed irrelevant information. This concerns entity, item and recipe tooltips, but almost all tooltips were touched one way or another. Many things were changed. I will go through some of the more important changes. There is also a link <a href="https://steamcommunity.com/ogg/593110/announcements/detail/1599264607923965569">here</a>.`;

      const processor = new SteamProcessor();
      const actual = processor.process(sampleText);

      expect(actual).toEqual(expected);
    });
  });
});
