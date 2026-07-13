# Frontend Phase 07 - Accessibility, Multilingual, Voice, And Senior Mode

## Objective

Make accessibility a first-class production layer across MedClaro, not a settings page only. This phase defines how language, voice, high contrast, reduced motion, text sizing, and Senior Mode affect the whole app.

## Accessibility Surfaces

- Global accessibility menu in the top bar.
- Full Access & Language settings page.
- Simplified Health Hub preview.
- Senior Mode onboarding prompt.
- Read-aloud controls on reports, assistant responses, doctor summaries, and emergency profile.

## Preferences

Support:

- Preferred language.
- Fallback language.
- Senior Mode.
- Simplified dashboard.
- Text size.
- High contrast.
- Reduce motion.
- Voice summaries.
- Read-aloud reports.
- Assistant voice input planning.
- One-click actions.

## Senior Mode Behavior

Senior Mode should:

- Increase text and controls.
- Reduce visible navigation choices.
- Simplify the Health Hub.
- Use clear labels instead of dense metadata.
- Prioritize emergency profile, latest summary, medicines, reminders, and family contact.
- Keep assistant prompts simple and voice-friendly.

## Multilingual Strategy

The frontend should preserve:

- Medical terms.
- Units.
- Numbers.
- Normal ranges.
- Severity labels.
- Doctor prompts.
- English fallback.

Language changes should affect navigation, labels, explanations, assistant responses, and read-aloud scripts over time. Early implementation can scope translation to backend-generated artifacts and static UI strings separately.

## Voice Strategy

Voice and read-aloud should be planned for:

- Report summaries.
- Biomarker explanations.
- Assistant responses.
- Doctor summaries.
- Emergency profile.

Voice controls:

- Play/pause.
- Replay.
- Speed.
- Language.
- Text transcript.

## Accessibility Testing

Required checks:

- Keyboard-only navigation.
- Screen-reader labels.
- Focus order.
- Color contrast.
- Reduced motion.
- High contrast mode.
- Text zoom to 200%.
- Mobile touch targets.
- Chart alternatives.

## Component Needs

- `AccessibilityMenu`
- `LanguageSelector`
- `TextSizeSelector`
- `SeniorModeToggle`
- `HighContrastToggle`
- `ReduceMotionToggle`
- `VoiceSummaryControl`
- `ReadAloudButton`
- `SimplifiedDashboardPreview`
- `OneClickActionEditor`

## Completion Checklist

- [ ] Accessibility preferences mapped to global UI behavior.
- [ ] Senior Mode behavior defined across modules.
- [ ] Multilingual preservation rules defined.
- [ ] Voice/read-aloud controls defined.
- [ ] Accessibility testing checklist defined.
- [ ] Simplified dashboard strategy defined.

