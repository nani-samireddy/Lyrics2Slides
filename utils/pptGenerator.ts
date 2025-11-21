import PptxGenJS from "pptxgenjs";

export const generateAndDownloadPPT = async (formattedLyrics: string) => {
  try {
    // 1. Initialize PPT
    const pres = new PptxGenJS();
    
    // 2. Set Presentation Properties
    pres.layout = "LAYOUT_16x9";
    pres.author = "Lyrics Auto Formatter";
    pres.title = "Worship Lyrics";
    
    // Define a dark theme master slide (standard for church projection)
    pres.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: "000000" },
    });

    // 3. Parse Lyrics into Slides
    // Split by double newlines to identify blocks
    const blocks = formattedLyrics.split(/\n\s*\n/);

    blocks.forEach((block) => {
      if (!block.trim()) return;

      const slide = pres.addSlide();
      slide.masterName = "MASTER_SLIDE";

      slide.addText(block.trim(), {
        x: 0.5, // Slight padding
        y: 0,
        w: "90%", // Leave room
        h: "100%",
        align: "center",
        valign: "middle",
        fontFace: "Arial", // Safe font, supports unicode reasonably well
        fontSize: 44,
        color: "FFFFFF",
        bold: true,
        lineSpacing: 48, // Increases readability
      });
    });

    // 4. Save the file
    const date = new Date().toISOString().slice(0, 10);
    await pres.writeFile({ fileName: `Lyrics-${date}.pptx` });
    
    return true;
  } catch (error) {
    console.error("PPT Generation Error:", error);
    throw new Error("Failed to generate PowerPoint file.");
  }
};