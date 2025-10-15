// Type declarations for CDN libraries
declare const pdfjsLib: any;
declare const mammoth: any;
declare const JSZip: any;
declare const XLSX: any;

// --- Text Extraction Functions ---

async function parseTxt(file: File): Promise<string> {
  return file.text();
}

async function parsePdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let textContent = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const text = await page.getTextContent();
    textContent += text.items.map((item: any) => item.str).join(' ');
  }
  return textContent;
}

async function parseDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function parseXlsx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
    let textContent = '';
    workbook.SheetNames.forEach((sheetName: string) => {
        const sheet = workbook.Sheets[sheetName];
        textContent += XLSX.utils.sheet_to_csv(sheet);
    });
    return textContent;
}

async function parsePptx(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file);
  const slidePromises: Promise<string>[] = [];
  zip.folder('ppt/slides')?.forEach((relativePath, zipEntry) => {
    if (relativePath.endsWith('.xml')) {
      slidePromises.push(
        zipEntry.async('string').then(xmlContent => {
          const textNodes = xmlContent.match(/<a:t>.*?<\/a:t>/g) || [];
          return textNodes.map(node => node.replace(/<.*?>/g, '')).join(' ');
        })
      );
    }
  });
  const slideTexts = await Promise.all(slidePromises);
  return slideTexts.join('\n\n');
}

async function parseZip(file: File): Promise<string> {
    const zip = await JSZip.loadAsync(file);
    let combinedText = '';
    const textFilePromises: Promise<void>[] = [];

    zip.forEach((relativePath, zipEntry) => {
        // A simple check for text-based files, can be expanded
        if (!zipEntry.dir && /\.(txt|json|xml|html|css|js|md|csv)$/i.test(zipEntry.name)) {
            const promise = zipEntry.async('string').then(content => {
                combinedText += `--- Content from ${zipEntry.name} ---\n${content}\n\n`;
            }).catch(err => {
                console.warn(`Could not read ${zipEntry.name} from zip as text.`, err);
            });
            textFilePromises.push(promise);
        }
    });

    await Promise.all(textFilePromises);
    if (!combinedText) {
        throw new Error("No readable text-based files found in the ZIP archive.");
    }
    return combinedText;
}


// --- Main Parser Function ---

export const parseFile = async (file: File): Promise<string> => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
        case 'txt':
        case 'md':
        case 'json':
        case 'csv':
        case 'html':
        case 'css':
        case 'js':
        case 'ts':
        case 'tsx':
        case 'py':
        case 'xml':
            return parseTxt(file);
        case 'pdf':
            return parsePdf(file);
        case 'docx':
            return parseDocx(file);
        case 'xlsx':
        case 'xls':
            return parseXlsx(file);
        case 'pptx':
            return parsePptx(file);
        case 'zip':
            return parseZip(file);
        default:
            // Fallback for unknown extensions: try to read as text.
            try {
                // Heuristic to avoid trying to read large binary files as text
                if (file.size > 10 * 1024 * 1024) { // 10 MB limit
                    throw new Error("File is too large to be read as plain text.");
                }
                const content = await parseTxt(file);
                // Basic check if the content is mostly printable ASCII
                 if (/[\x00-\x08\x0E-\x1F]/.test(content)) {
                    throw new Error("File appears to be binary and not readable as text.");
                }
                return `--- Content from ${file.name} (read as plain text) ---\n${content}`;
            } catch (err) {
                 throw new Error(`Unsupported file type: .${extension}. Could not be read as text.`);
            }
    }
};
