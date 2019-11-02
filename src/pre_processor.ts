export default abstract class PreProcessor {
  /** Pre-processes the HTML content. */
  public abstract process(htmlContent: string): string;
}
