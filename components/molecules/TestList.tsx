'use client';

import { useState, useEffect } from 'react';

type Test = {
  id: string;
  prompt: string;
  expected_traits_json: Record<string, unknown> | null;
  forbidden_traits_json: Record<string, unknown> | null;
  created_at: string;
};

type TestListProps = {
  tests: Test[];
  onAddTest: (prompt: string, expectedText: string, forbiddenText: string) => void;
  addingTest?: boolean;
  addTestError?: string | null;
  autoOpenForm?: boolean;
};

export default function TestList({
  tests,
  onAddTest,
  addingTest = false,
  addTestError = null,
  autoOpenForm = false,
}: TestListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [expectedText, setExpectedText] = useState('');
  const [forbiddenText, setForbiddenText] = useState('');

  // Sync form open state with autoOpenForm prop
  useEffect(() => {
    setFormOpen(autoOpenForm);
  }, [autoOpenForm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    onAddTest(prompt.trim(), expectedText.trim(), forbiddenText.trim());
    // Form state reset is handled by parent's load() changing autoOpenForm to false
  };

  const handleCancel = () => {
    setFormOpen(false);
    setPrompt('');
    setExpectedText('');
    setForbiddenText('');
  };

  return (
    <div className="test-list">
      <div className="test-list__header">
        <span className="test-list__title">Tests</span>
        <span className="test-list__count">{tests.length}</span>
        {!formOpen && (
          <button
            className="btn btn-brand"
            onClick={() => setFormOpen(true)}
            type="button"
          >
            + Add Test
          </button>
        )}
      </div>

      {formOpen && (
        <form className="test-form" onSubmit={handleSubmit}>
          <div className="test-form__field">
            <label className="test-form__label">Prompt *</label>
            <textarea
              className="test-form__textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What should this AI say or do?"
              rows={3}
              required
            />
          </div>
          <div className="test-form__field">
            <label className="test-form__label">Expected behavior (optional)</label>
            <textarea
              className="test-form__textarea"
              value={expectedText}
              onChange={(e) => setExpectedText(e.target.value)}
              placeholder="Describe traits or patterns the response should contain"
              rows={2}
            />
          </div>
          <div className="test-form__field">
            <label className="test-form__label">Forbidden behavior (optional)</label>
            <textarea
              className="test-form__textarea"
              value={forbiddenText}
              onChange={(e) => setForbiddenText(e.target.value)}
              placeholder="Describe traits or patterns the response must NOT contain"
              rows={2}
            />
          </div>
          {addTestError && (
            <p className="test-form__error">{addTestError}</p>
          )}
          <div className="test-form__actions">
            <button
              className="btn btn-brand"
              type="submit"
              disabled={addingTest || !prompt.trim()}
            >
              {addingTest ? 'Adding...' : 'Add Test'}
            </button>
            <button
              className="btn btn-default"
              type="button"
              onClick={handleCancel}
              disabled={addingTest}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {tests.length > 0 && (
        <div className="test-list__items">
          {tests.map((test) => (
            <div key={test.id} className="test-item">
              <p className="test-item__prompt">{test.prompt}</p>
              {test.expected_traits_json &&
                typeof test.expected_traits_json === 'object' &&
                'description' in test.expected_traits_json && (
                  <p className="test-item__expected">
                    ✓ {test.expected_traits_json.description as string}
                  </p>
                )}
              {test.forbidden_traits_json &&
                typeof test.forbidden_traits_json === 'object' &&
                'description' in test.forbidden_traits_json && (
                  <p className="test-item__forbidden">
                    ✗ {test.forbidden_traits_json.description as string}
                  </p>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
