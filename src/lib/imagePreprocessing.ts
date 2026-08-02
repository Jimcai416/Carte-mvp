import * as ImageManipulator from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";

const MAX_SCAN_EDGE = 1800;
const VERY_TALL_RATIO = 0.58;

export type PreparedMenuImage = {
  base64: string;
  mediaType: "image/jpeg";
  previewUri: string;
  retryBase64?: string;
};

function resizeAction(width: number, height: number) {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= MAX_SCAN_EDGE) return [];
  const scale = MAX_SCAN_EDGE / longestEdge;
  return [{ resize: { width: Math.round(width * scale), height: Math.round(height * scale) } }];
}

/**
 * Normalise every provider/camera format before upload. For unusually tall
 * images, also prepare a top-focused copy that removes likely letterboxing or
 * a second page below the main menu. The focused copy is only used after the
 * complete image fails, so legitimate tall menus are never discarded first.
 */
export async function prepareMenuImage(
  asset: ImagePickerAsset
): Promise<PreparedMenuImage> {
  const width = Math.max(1, asset.width || 1);
  const height = Math.max(1, asset.height || 1);
  const normalised = await ImageManipulator.manipulateAsync(
    asset.uri,
    resizeAction(width, height),
    {
      base64: true,
      compress: 0.82,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );

  let retryBase64: string | undefined;
  if (width / height < VERY_TALL_RATIO) {
    const cropHeight = Math.min(height, Math.round(width / VERY_TALL_RATIO));
    const originY = Math.min(
      Math.round(height * 0.035),
      Math.max(0, height - cropHeight)
    );
    const focused = await ImageManipulator.manipulateAsync(
      asset.uri,
      [
        { crop: { originX: 0, originY, width, height: cropHeight } },
        ...resizeAction(width, cropHeight),
      ],
      {
        base64: true,
        compress: 0.86,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    retryBase64 = focused.base64 || undefined;
  }

  if (!normalised.base64) {
    throw new Error("This photo could not be prepared. Try taking it again.");
  }

  return {
    base64: normalised.base64,
    mediaType: "image/jpeg",
    previewUri: normalised.uri,
    retryBase64,
  };
}
