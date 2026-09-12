import { bold, br, doc, image, link, list, listItem, paragraph } from 'src/markup/build.js';
import extractCoverImage from 'src/markup/media.js';

const BANNER = 'https://example.com/banner.png';
const CLOSER = 'https://example.com/closer.png';

describe('Cover image extraction', () => {
  describe('an opening image', () => {
    test('should take an image that is a paragraph of its own', () => {
      const result = extractCoverImage(doc(paragraph(image(BANNER)), paragraph('Body')));

      expect(result.image).toEqual(image(BANNER));
      expect(result.document).toEqual(doc(paragraph('Body')));
    });

    test('should take an image that runs straight into the first sentence', () => {
      // Steam posts do this constantly: `[p][img]...[/img]The first...[/p]`.
      const result = extractCoverImage(doc(paragraph(image(BANNER), br(), 'The first sentence.')));

      expect(result.image).toEqual(image(BANNER));
      expect(result.document).toEqual(doc(paragraph('The first sentence.')));
    });

    test('should look past leading whitespace', () => {
      const result = extractCoverImage(doc(paragraph(br(), ' ', image(BANNER)), paragraph('Body')));

      expect(result.image).toEqual(image(BANNER));
    });

    test('should keep the alt text with the image', () => {
      const result = extractCoverImage(doc(paragraph(image(BANNER, 'Cover')), paragraph('Body')));

      expect(result.image).toEqual(image(BANNER, 'Cover'));
    });
  });

  describe('a closing image', () => {
    test('should take an image that ends the post', () => {
      const result = extractCoverImage(doc(paragraph('Body'), paragraph(image(CLOSER))));

      expect(result.image).toEqual(image(CLOSER));
      expect(result.document).toEqual(doc(paragraph('Body')));
    });

    test('should take an image that closes the last paragraph', () => {
      const result = extractCoverImage(doc(paragraph('Body', br(), image(CLOSER))));

      expect(result.image).toEqual(image(CLOSER));
      expect(result.document).toEqual(doc(paragraph('Body')));
    });

    test('should prefer the opening image when there are both', () => {
      const tree = doc(paragraph(image(BANNER)), paragraph('Body'), paragraph(image(CLOSER)));
      const result = extractCoverImage(tree);

      expect(result.image).toEqual(image(BANNER));
      // Only one image slot: the closing image stays in the text.
      expect(result.document).toEqual(doc(paragraph('Body'), paragraph(image(CLOSER))));
    });
  });

  describe('what it leaves alone', () => {
    test('should not take an image from the middle of the post', () => {
      const tree = doc(paragraph('Before'), paragraph(image(BANNER)), paragraph('After'));
      const result = extractCoverImage(tree);

      expect(result.image).toBeUndefined();
      expect(result.document).toBe(tree);
    });

    test('should not take an image that follows text in the first paragraph', () => {
      const tree = doc(paragraph('Look at this: ', image(BANNER)), paragraph('Body'));

      expect(extractCoverImage(tree).image).toBeUndefined();
    });

    test('should not take a clickable banner, which would lose where it points', () => {
      const tree = doc(paragraph(link('https://example.com', image(BANNER))), paragraph('Body'));

      expect(extractCoverImage(tree).image).toBeUndefined();
    });

    test('should not take an image from inside a list', () => {
      const tree = doc(list(listItem(paragraph(image(BANNER)))));

      expect(extractCoverImage(tree).image).toBeUndefined();
    });

    test('should not take an image from inside emphasis', () => {
      const tree = doc(paragraph(bold(image(BANNER))), paragraph('Body'));

      expect(extractCoverImage(tree).image).toBeUndefined();
    });

    test('should return an empty document as it is', () => {
      const tree = doc();

      expect(extractCoverImage(tree)).toEqual({ document: tree });
    });
  });

  test('should leave an empty document when the post is only an image', () => {
    const result = extractCoverImage(doc(paragraph(image(BANNER))));

    expect(result.image).toEqual(image(BANNER));
    expect(result.document).toEqual(doc());
  });
});
