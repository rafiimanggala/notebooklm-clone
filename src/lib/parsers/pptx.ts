import AdmZip from 'adm-zip';

interface PptxResult {
  title: string;
  content: string;
  slideCount: number;
}

export async function parsePptx(buffer: Buffer): Promise<PptxResult> {
  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    const slideEntries = entries
      .filter(e => /^ppt\/slides\/slide\d+\.xml$/i.test(e.entryName))
      .sort((a, b) => {
        const numA = parseInt(a.entryName.match(/slide(\d+)/)?.[1] ?? '0');
        const numB = parseInt(b.entryName.match(/slide(\d+)/)?.[1] ?? '0');
        return numA - numB;
      });

    if (slideEntries.length === 0) {
      throw new Error('No slides found in PPTX');
    }

    const slides: string[] = [];

    for (const entry of slideEntries) {
      const xml = entry.getData().toString('utf8');
      const textParts = xml.match(/<a:t>([^<]*)<\/a:t>/g)
        ?.map(m => m.replace(/<\/?a:t>/g, ''))
        .filter(t => t.trim().length > 0) ?? [];
      slides.push(textParts.join(' '));
    }

    const noteEntries = entries
      .filter(e => /^ppt\/notesSlides\/notesSlide\d+\.xml$/i.test(e.entryName))
      .sort((a, b) => {
        const numA = parseInt(a.entryName.match(/notesSlide(\d+)/)?.[1] ?? '0');
        const numB = parseInt(b.entryName.match(/notesSlide(\d+)/)?.[1] ?? '0');
        return numA - numB;
      });

    const notes: string[] = [];
    for (const entry of noteEntries) {
      const xml = entry.getData().toString('utf8');
      const textParts = xml.match(/<a:t>([^<]*)<\/a:t>/g)
        ?.map(m => m.replace(/<\/?a:t>/g, ''))
        .filter(t => t.trim().length > 0) ?? [];
      notes.push(textParts.join(' '));
    }

    const content = slides
      .map((s, i) => {
        let slideText = `[Slide ${i + 1}]\n${s}`;
        if (notes[i]?.trim()) {
          slideText += `\n[Speaker Notes] ${notes[i]}`;
        }
        return slideText;
      })
      .join('\n\n')
      .trim();

    const title = slides[0]?.slice(0, 200).trim() || 'Untitled Presentation';

    return { title, content, slideCount: slides.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse PPTX: ${message}`);
  }
}
