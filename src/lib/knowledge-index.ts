import type { CustomRecord } from 'pagefind';
import { lessonTrails, lessons, topicIntroductions } from '../data/lessons';
import { topics } from '../data/topics';
import { firmwareMedia, inavNote } from '../data/firmware-media';
import { simulators, accessLabels } from '../data/simulators';
import { simulatorExercises } from '../data/simulator-exercises';
import { simulatorSections } from '../data/simulator-sections';
import { locales, pageUrl } from './i18n';

export function knowledgeRecords(): CustomRecord[] {
  const records: CustomRecord[] = [];
  for (const locale of locales) {
    const i = locale === 'uk' ? 0 : 1;
    for (const topic of topics) {
      const root = 'knowledge/' + topic.id;
      const category = topic.title[locale];
      function add(
        path: string,
        title: string,
        trail: string[],
        body: string[],
        options: { anchor?: string; alias?: string } = {},
      ) {
        const href =
          pageUrl(locale, path) + (options.anchor ? '#' + options.anchor : '');
        records.push({
          language: locale,
          url: href,
          content: body.join('\n'),
          meta: {
            title,
            trail: trail.join(' / '),
            ...(options.alias && { alias: options.alias }),
          },
          filters: { topic: [topic.id] },
        });
      }
      add(
        root,
        category,
        [],
        [
          topic.summary[locale],
          topicIntroductions[topic.id][i],
          topic.question[locale],
          topic.note[locale],
        ],
        { alias: topic.title[locale === 'uk' ? 'en' : 'uk'] },
      );
      for (const trail of lessonTrails(lessons[topic.id])) {
        const node = trail.at(-1)!;
        add(
          root + '/' + trail.map((n) => n.id).join('/'),
          node.title[i],
          [category, ...trail.slice(0, -1).map((n) => n.title[i])],
          [
            ...node.paragraphs.map((p) => p[i]),
            node.detail?.caption?.[i] ?? '',
          ],
          { alias: node.title[1 - i] },
        );
      }
      if (topic.id === 'simulators') {
        for (const section of simulatorSections) {
          const path = root + '/' + section.id,
            title = section.title[i],
            trail = [category, title];
          add(path, title, [category], [section.intro[i]], {
            alias: section.title[1 - i],
          });
          if (section.id === 'catalog') {
            for (const item of simulators)
              add(
                path,
                item.name,
                trail,
                [
                  item.description[locale],
                  item.platforms.join(' / '),
                  accessLabels[item.access][locale],
                  ...item.previews.map((p) => p.caption[locale]),
                ],
                { anchor: item.id },
              );
          } else {
            for (const item of simulatorExercises)
              add(path, item.title[i], trail, [item.text[i], item.check[i]], {
                anchor: item.id,
                alias: item.title[1 - i],
              });
          }
        }
      }
      if (topic.id === 'firmware') {
        add(root, inavNote.title[locale], [category], [inavNote.text[locale]], {
          anchor: inavNote.id,
        });
        for (const item of firmwareMedia)
          add(
            root,
            item.name,
            [category],
            [
              item.description[locale],
              ...item.previews.map((p) => p.caption[locale]),
            ],
            { anchor: item.id },
          );
      }
    }
  }
  return records;
}
