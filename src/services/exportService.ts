import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType, 
  BorderStyle,
  VerticalAlign
} from "docx";
import { saveAs } from "file-saver";

export const exportKmzhToDocx = async (data: any) => {
  const { metadata, stages, lessonObjectives, assessmentCriteria, languageObjectives, values, crossCurricularLinks, previousLearning, differentiation, assessmentCheck, healthAndSafety, reflection } = data;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: metadata.ministry || "Қазақстан Республикасы Оқу-ағарту министрлігі",
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: metadata.school || "Мектеп атауы",
                bold: true,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [
              new TextRun({
                text: "Қысқа мерзімді жоспар",
                bold: true,
                size: 28,
              }),
            ],
          }),

          // Metadata Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              createRow("Білім беру ұйымының атауы", metadata.school),
              createRow("Пәні", metadata.subject),
              createRow("Бөлім", metadata.section),
              createRow("Педагогтің аты-жөні", metadata.teacher),
              createRow("Күні", metadata.date),
              createRow("Сынып", metadata.grade),
              createRow("Қатысушылар саны", metadata.participants),
              createRow("Қатыспағандар саны", metadata.absent),
            ],
          }),

          new Paragraph({ spacing: { before: 200 } }),

          new Paragraph({
            children: [new TextRun({ text: "Тақырыбы: ", bold: true }), new TextRun(metadata.topic)],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Оқу бағдарламасына сәйкес оқыту мақсаты: ", bold: true }), new TextRun(metadata.learningObjective)],
          }),

          // Lesson Objectives
          new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "Сабақтың мақсаты: ", bold: true })] }),
          ...(lessonObjectives || []).map((obj: string) => new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun(obj)],
          })),

          // Assessment Criteria
          new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "Бағалау критерийлері: ", bold: true })] }),
          ...(assessmentCriteria || []).map((crit: string) => new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun(crit)],
          })),

          // Language Objectives
          new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: "Тілдік мақсаттар: ", bold: true })] }),
          new Paragraph({
            children: [
              new TextRun({ text: "Лексика және терминология: ", italics: true }),
              new TextRun((languageObjectives?.vocabulary || []).join(", ")),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Диалог пен жазу үшін пайдалы сөз тіркестері: ", italics: true }),
              new TextRun((languageObjectives?.phrases || []).join("; ")),
            ],
          }),

          new Paragraph({
            children: [new TextRun({ text: "Құндылықтарды дарыту: ", bold: true }), new TextRun(values || metadata.value)],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Пәнаралық байланыс: ", bold: true }), new TextRun(crossCurricularLinks || "")],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Алдыңғы білім: ", bold: true }), new TextRun(previousLearning || "")],
          }),

          new Paragraph({ spacing: { before: 400, after: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "САБАҚТЫҢ БАРЫСЫ", bold: true, size: 24 })] }),

          // Lesson Flow Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  createHeaderCell("Сабақтың жоспарланған кезеңдері"),
                  createHeaderCell("Педагогтің әрекеті"),
                  createHeaderCell("Оқушының әрекеті"),
                  createHeaderCell("Бағалау"),
                  createHeaderCell("Ресурстар"),
                ],
              }),
              ...stages.map((stage: any) => new TableRow({
                children: [
                  createCell(stage.period),
                  createCell(stage.teacherAction),
                  createCell(stage.studentAction),
                  createCell(stage.assessment),
                  createCell(stage.resources),
                ],
              })),
            ],
          }),

          new Paragraph({ spacing: { before: 200 } }),
          new Paragraph({
            children: [new TextRun({ text: "Саралау: ", bold: true }), new TextRun(differentiation || "")],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Бағалау: ", bold: true }), new TextRun(assessmentCheck || "")],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Денсаулық және қауіпсіздік техникасын сақтау: ", bold: true }), new TextRun(healthAndSafety || "")],
          }),
          new Paragraph({
            children: [new TextRun({ text: "Рефлексия: ", bold: true }), new TextRun(reflection || "")],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `KMZH_${metadata.topic.replace(/\s+/g, "_")}.docx`);
};

function createRow(label: string, value: string) {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 40, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true })] })],
      }),
      new TableCell({
        width: { size: 60, type: WidthType.PERCENTAGE },
        children: [new Paragraph(value || "")],
      }),
    ],
  });
}

function createHeaderCell(text: string) {
  return new TableCell({
    shading: { fill: "F2F2F2" },
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true })] })],
    verticalAlign: VerticalAlign.CENTER,
  });
}

function createCell(text: string) {
  return new TableCell({
    children: [new Paragraph(text || "")],
    verticalAlign: VerticalAlign.CENTER,
  });
}
