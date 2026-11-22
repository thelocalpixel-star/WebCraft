from datetime import datetime
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest import TestCase, main
import xml.etree.ElementTree as ET

from publish_articles import build, ROOT


class PublishingTest(TestCase):
    def setUp(self):
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.output = Path(self.temp.name) / 'site'

    def test_daily_boundary_and_link_visibility(self):
        before = datetime.fromisoformat('2026-11-23T14:16:59+00:00')
        self.assertEqual(build(ROOT, self.output, before), [])
        self.assertFalse((self.output / 'cleveland-website-redesign-url-inventory.html').exists())
        self.assertFalse((self.output / '_editorial').exists())
        self.output = Path(self.temp.name) / 'site-after'
        after = datetime.fromisoformat('2026-11-23T14:17:00+00:00')
        names = build(ROOT, self.output, after)
        self.assertEqual(len(names), 32)
        self.assertIn('cleveland-website-redesign-url-inventory.html', names)
        for file in ['insights.html', 'sitemap.xml', 'web-design-cleveland-tn.html', 'web-design.html']:
            self.assertIn(names[0], (self.output / file).read_text())
        self.assertTrue((self.output / 'chattanooga-scheduling-holiday-business-hours.html').exists())

    def test_every_staged_article_has_one_canonical_url(self):
        end = datetime.fromisoformat('2026-12-22T14:17:00+00:00')
        names = build(ROOT, self.output, end)
        self.assertGreaterEqual(len(names), 32)
        self.assertEqual(len(set(names)), len(names))
        urls = [x.text for x in ET.parse(self.output/'sitemap.xml').findall('{*}url/{*}loc')]
        self.assertEqual(len(urls), len(set(urls)))
        original = ET.parse(ROOT/'sitemap.xml').findall('{*}url/{*}loc')
        self.assertEqual(len(urls), len(original) + len(names))
        insights = (self.output/'insights.html').read_text()
        for name in names:
            self.assertTrue((self.output/name).is_file())
            self.assertIn('/'+name, insights)
            self.assertIn('https://localwebcraft.com/'+name, urls)


if __name__ == '__main__':
    main()
