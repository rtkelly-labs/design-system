/**
 * Minimal renders for components and parts no story shows on its own. A story-less export has to
 * appear here or in OPAQUE (slots.test.tsx), so a new one cannot slip past the slot contract unseen.
 * Keep each one the smallest thing that puts the component's elements in the markup.
 */

import type { ReactNode } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../components/Table';
import { SiteLink } from '../components/LinkProvider';
import { DocsLink } from '../components/docs/DocsLinkProvider';
import { AsciiDivider } from '../components/AsciiDivider';
import { Glyph } from '../components/Glyph';
import { BlueskyIcon, GitHubIcon, LinkedInIcon, MailIcon, XIcon } from '../components/SocialIcon';

export const FIXTURES: Record<string, () => ReactNode> = {
  Table: () => (
    <Table>
      <TableCaption>caption</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>head</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>cell</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>foot</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
  SiteLink: () => <SiteLink href="/docs">Docs</SiteLink>,
  DocsLink: () => <DocsLink href="/guide">Guide</DocsLink>,
  AsciiDivider: () => <AsciiDivider />,
  Glyph: () => (
    <>
      <Glyph name="git-branch" />
      <Glyph bracketed>{'->'}</Glyph>
    </>
  ),
  GitHubIcon: () => <GitHubIcon />,
  LinkedInIcon: () => <LinkedInIcon />,
  BlueskyIcon: () => <BlueskyIcon />,
  XIcon: () => <XIcon />,
  MailIcon: () => <MailIcon />,
};
