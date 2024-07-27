import { Action } from "@elgato/streamdeck";
import { Controller } from "@interfaces/controller";
import { handleAsyncException } from "@root/utils/handleAsyncException";
import {
  CompiledSvgTemplate,
  generateSvgForSetImage,
  isSvg,
  Replacements,
} from "@root/utils/svg";

/**
 * Base implementation for a Controller that includes methods for
 * managing the title and image display on a StreamDeck action.
 */
export abstract class BaseController implements Controller {
  /**
   * Used to type guard the derived classes.
   */
  abstract type: string;

  /**
   * The StreamDeck action this controller manages.
   */
  action: Action;

  /**
   * Initializes the BaseController.
   * @param action The StreamDeck icon this wraps
   */
  constructor(action: Action) {
    this.action = action;
  }

  /**
   * Resets the controller to its default state.
   */
  abstract reset(): void;

  /**
   * Sets the title on the tracked action, catching any exceptions
   * that might occur.
   * @param title The title to set.
   */
  setTitle(title: string) {
    this.action.setTitle(title).catch((error: unknown) => {
      handleAsyncException("Unable to set action title: ", error);
    });
  }

  /**
   * Sets the image on the tracked action after populating
   * an SVG template with replacements, catching any exceptions
   * that might occur.
   * @param template The SVG template to populate
   * @param replacements The replacements to use
   */
  setImage(
    imagePath: string | undefined,
    template: CompiledSvgTemplate,
    replacements: Replacements
  ) {
    // Check and see if the image is an SVG. If so use the template, if not
    // just pass the path and let StreamDeck do the rendering.
    if (isSvg(imagePath)) {
      const generatedSvg = generateSvgForSetImage(template, replacements);
      this.action.setImage(generatedSvg).catch((error: unknown) => {
        handleAsyncException("Unable to set state image: ", error);
      });
    } else {
      this.action.setImage(imagePath).catch((error: unknown) => {
        handleAsyncException("Unable to set state image: ", error);
      });
    }
  }
}
