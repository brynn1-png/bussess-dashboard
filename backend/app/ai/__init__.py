"""AI provider integration (architecture.md §4: AI Layer).

Provider-specific engines stay isolated here; the rest of the application
talks to them only through the `AIProvider` protocol.
"""
