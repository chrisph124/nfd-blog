import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthorProfile from '@/components/organisms/AuthorProfile';
import { AUTHOR_EMAIL } from '@/lib/seo/author';

describe('AuthorProfile', () => {
  it('opens profile links in a new tab marked as the author\'s own', () => {
    render(<AuthorProfile />);

    for (const name of ['GitHub', 'LinkedIn']) {
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'me noopener noreferrer');
    }
  });

  it('shows the contact email as a plain mailto link', () => {
    render(<AuthorProfile />);

    const email = screen.getByRole('link', { name: AUTHOR_EMAIL });
    expect(email).toHaveAttribute('href', `mailto:${AUTHOR_EMAIL}`);
    expect(email).not.toHaveAttribute('target');
  });
});
