interface CsvResult {
  title: string;
  content: string;
  columns: string[];
  rowCount: number;
}

export async function parseCsv(content: string, title?: string): Promise<CsvResult> {
  try {
    const normalized = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    if (!normalized) {
      throw new Error('Empty CSV content provided');
    }

    const lines = normalized.split('\n').filter((line) => line.trim().length > 0);

    if (lines.length < 1) {
      throw new Error('CSV must have at least a header row');
    }

    const columns = parseCsvLine(lines[0]);
    const dataLines = lines.slice(1);
    const rowCount = dataLines.length;

    // Convert each row to readable text
    const rows = dataLines.map((line) => {
      const values = parseCsvLine(line);
      return columns
        .map((col, i) => `${col}: ${values[i] ?? ''}`)
        .join(', ');
    });

    const textContent = rows.join('\n');
    const resolvedTitle = title?.trim() || `CSV Data (${rowCount} rows)`;

    return {
      title: resolvedTitle,
      content: textContent,
      columns,
      rowCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse CSV: ${message}`);
  }
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        // Check for escaped quote (doubled)
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  values.push(current.trim());
  return values;
}
