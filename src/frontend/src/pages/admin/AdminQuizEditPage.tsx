// Admin — Quiz edit page. Full edit screen for a single quiz with two
// sections: (1) quiz details form (title, optional description, passing
// percentage) with save, and (2) an embedded question editor — an ordered
// list of questions with add / edit / delete / move up / move down. Each
// question has text, a single-answer vs multiple-answer type toggle, and a
// list of answer options with text inputs and correct-answer marking (radio
// for single, checkbox for multiple). Mirrors the TrainingStepsEditor
// reorder pattern.
//
// Route: /admin/quizzes/$quizId (wired in App.tsx). The page reads the quiz
// id from the route params.

import { QuestionType } from "@/backend";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateQuestion,
  useDeleteQuestion,
  useMoveQuestion,
  usePositions,
  useQuestions,
  useQuiz,
  useUpdateQuestion,
  useUpdateQuiz,
} from "@/hooks/useQueries";
import type { QuestionEdit, QuestionInput } from "@/types";
import type { QuestionOptionView, QuestionView } from "@/types";
import { toQuestionView } from "@/types";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const PASSING_OPTIONS = [60, 70, 75, 80, 85, 90, 100];

export function AdminQuizEditPage() {
  const { quizId } = useParams({ from: "/admin-layout/admin/quizzes/$quizId" });
  const id = BigInt(quizId);
  const navigate = useNavigate();

  const { data: quiz, isLoading: quizLoading } = useQuiz(id);
  const { data: positions = [] } = usePositions();
  const updateQuizMut = useUpdateQuiz();

  // Quiz details form state.
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [passingPercentage, setPassingPercentage] = useState(80);
  const [positionName, setPositionName] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate the form once the quiz loads.
  if (quiz && !hydrated) {
    setTitle(quiz.title);
    setDescription(quiz.description ?? "");
    setPassingPercentage(Number(quiz.passingPercentage));
    setHydrated(true);
  }
  // Resolve the position name for the header subtitle.
  useEffect(() => {
    if (quiz && positions.length > 0) {
      const pos = positions.find((p) => p.id === quiz.positionId);
      setPositionName(pos ? pos.name : null);
    }
  }, [quiz, positions]);

  const titleError = touched && title.trim().length === 0;
  const canSave = title.trim().length > 0;
  const detailsDirty =
    !!quiz &&
    (quiz.title !== title.trim() ||
      (quiz.description ?? "") !== description.trim() ||
      Number(quiz.passingPercentage) !== passingPercentage);

  async function saveDetails() {
    setTouched(true);
    if (!canSave || !quiz) return;
    try {
      await updateQuizMut.mutateAsync({
        quizId: id,
        edit: {
          title: title.trim(),
          description:
            description.trim() === "" ? undefined : description.trim(),
          passingPercentage: BigInt(passingPercentage),
        },
      });
      toast.success("Quiz details saved");
    } catch (err) {
      toast.error("Could not save quiz details");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  if (quizLoading) {
    return (
      <div
        className="flex items-center justify-center py-24"
        data-ocid="quiz_edit.loading_state"
      >
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-24 text-center"
        data-ocid="quiz_edit.error_state"
      >
        <p className="font-display text-lg font-semibold">Quiz not found</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          This quiz may have been deleted.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate({ to: "/admin/quizzes" })}
          data-ocid="quiz_edit.back_button"
        >
          <ArrowLeft className="size-4" /> Back to quizzes
        </Button>
      </div>
    );
  }

  return (
    <div
      className="mx-auto flex max-w-3xl flex-col gap-6"
      data-ocid="quiz_edit.page"
    >
      {/* Header */}
      <header className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => navigate({ to: "/admin/quizzes" })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          data-ocid="quiz_edit.back_link"
        >
          <ArrowLeft className="size-3.5" /> All quizzes
        </button>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {quiz.title || "Untitled quiz"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {positionName
            ? `Position: ${positionName}`
            : "Edit quiz details, passing percentage, and manage its ordered questions."}
        </p>
      </header>

      {/* Quiz details card */}
      <section
        className="rounded-lg border border-border bg-card p-6"
        data-ocid="quiz_edit.details.panel"
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="quiz-title" data-ocid="quiz_edit.title.label">
              Title
            </Label>
            <Input
              id="quiz-title"
              value={title}
              placeholder="e.g. Barista fundamentals"
              aria-invalid={titleError}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched(true)}
              data-ocid="quiz_edit.title.input"
            />
            {titleError && (
              <p
                className="text-xs text-destructive"
                data-ocid="quiz_edit.title.field_error"
              >
                Title is required.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="quiz-description"
              data-ocid="quiz_edit.description.label"
            >
              Description (optional)
            </Label>
            <Textarea
              id="quiz-description"
              value={description}
              rows={3}
              placeholder="Short summary shown to trainees before they start."
              onChange={(e) => setDescription(e.target.value)}
              data-ocid="quiz_edit.description.input"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label data-ocid="quiz_edit.passing.label">
              Passing percentage
            </Label>
            <Select
              value={String(passingPercentage)}
              onValueChange={(v) => setPassingPercentage(Number(v))}
            >
              <SelectTrigger data-ocid="quiz_edit.passing.select">
                <SelectValue placeholder="Select passing percentage" />
              </SelectTrigger>
              <SelectContent data-ocid="quiz_edit.passing.dropdown_menu">
                {PASSING_OPTIONS.map((p, i) => (
                  <SelectItem
                    key={p}
                    value={String(p)}
                    data-ocid={`quiz_edit.passing.option.${i + 1}`}
                  >
                    {p}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Trainees must score at or above this percentage to pass.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            {detailsDirty && (
              <span className="text-xs text-muted-foreground">
                Unsaved changes
              </span>
            )}
            <Button
              type="button"
              onClick={saveDetails}
              disabled={updateQuizMut.isPending || !detailsDirty}
              data-ocid="quiz_edit.save_button"
            >
              {updateQuizMut.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              <Save className="size-4" /> Save details
            </Button>
          </div>
        </div>
      </section>

      {/* Embedded question editor */}
      <QuestionsEditor quizId={id} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Questions editor — ordered list with add/edit/delete/reorder         */
/* ------------------------------------------------------------------ */

interface QuestionsEditorProps {
  quizId: bigint;
}

function QuestionsEditor({ quizId }: QuestionsEditorProps) {
  const { data: rawQuestions = [], isLoading } = useQuestions(quizId);
  const createMut = useCreateQuestion();
  const deleteMut = useDeleteQuestion();
  const moveMut = useMoveQuestion();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionView | null>(null);
  const [pendingDelete, setPendingDelete] = useState<QuestionView | null>(null);

  // useQuestions returns the raw backend QuestionPublic[] (order: bigint).
  // Convert to QuestionView[] (order: number) before sorting / rendering.
  const questions: QuestionView[] = rawQuestions.map(toQuestionView);
  const sorted = [...questions].sort((a, b) => a.order - b.order);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(q: QuestionView) {
    setEditing(q);
    setDialogOpen(true);
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const q = sorted[index];
    const targetOrder = BigInt(sorted[target].order);
    try {
      await moveMut.mutateAsync({
        quizId,
        questionId: q.id,
        newOrder: targetOrder,
      });
    } catch (err) {
      toast.error("Could not reorder question");
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync({
        quizId,
        questionId: pendingDelete.id,
      });
      toast.success("Question deleted");
    } catch (err) {
      toast.error("Could not delete question");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <section
      className="flex flex-col gap-4"
      data-ocid="quiz_edit.questions.section"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-base font-semibold">Questions</h2>
          <span className="text-xs text-muted-foreground">
            {sorted.length} question{sorted.length === 1 ? "" : "s"}
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openCreate}
          disabled={createMut.isPending}
          data-ocid="quiz_edit.add_question_button"
        >
          <Plus className="size-4" /> Add question
        </Button>
      </header>

      {isLoading ? (
        <div
          className="flex items-center justify-center rounded-md border border-border bg-card py-10"
          data-ocid="quiz_edit.questions.loading_state"
        >
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-muted/20 px-6 py-10 text-center"
          data-ocid="quiz_edit.questions.empty_state"
        >
          <ClipboardList className="size-6 text-muted-foreground" />
          <p className="font-medium text-foreground">No questions yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Add questions with answer options and mark the correct answer(s).
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {sorted.map((q, index) => (
            <li
              key={String(q.id)}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
              data-ocid={`quiz_edit.question.item.${index + 1}`}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap text-sm font-medium text-foreground">
                  {q.text}
                </p>
                <span className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
                  {q.type === "single" ? "Single answer" : "Multiple answers"}
                </span>
                <ul className="mt-3 flex flex-col gap-1.5">
                  {q.options.map((opt, oi) => (
                    <li
                      key={String(opt.id)}
                      className="flex items-center gap-2 text-sm"
                      data-ocid={`quiz_edit.question.option.${index + 1}.${oi + 1}`}
                    >
                      {opt.isCorrect ? (
                        <CheckCircle2 className="size-4 shrink-0 text-success" />
                      ) : (
                        <span className="size-4 shrink-0 rounded-full border border-border" />
                      )}
                      <span
                        className={
                          opt.isCorrect
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {opt.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={index === 0 || moveMut.isPending}
                  onClick={() => move(index, -1)}
                  aria-label="Move question up"
                  data-ocid={`quiz_edit.question.move_up.${index + 1}`}
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={index === sorted.length - 1 || moveMut.isPending}
                  onClick={() => move(index, 1)}
                  aria-label="Move question down"
                  data-ocid={`quiz_edit.question.move_down.${index + 1}`}
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => openEdit(q)}
                  aria-label="Edit question"
                  data-ocid={`quiz_edit.question.edit_button.${index + 1}`}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={deleteMut.isPending}
                  onClick={() => setPendingDelete(q)}
                  aria-label="Delete question"
                  data-ocid={`quiz_edit.question.delete_button.${index + 1}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      <QuestionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        quizId={quizId}
        question={editing}
      />

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
      >
        <AlertDialogContent data-ocid="quiz_edit.question.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              The question and its answer options will be removed. Remaining
              questions will keep their relative order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="quiz_edit.question.delete_cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="quiz_edit.question.delete_confirm_button"
            >
              {deleteMut.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Delete question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Question create / edit dialog                                        */
/* ------------------------------------------------------------------ */

interface OptionDraft {
  id: bigint | null;
  text: string;
  isCorrect: boolean;
}

interface QuestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: bigint;
  question: QuestionView | null;
}

function QuestionDialog({
  open,
  onOpenChange,
  quizId,
  question,
}: QuestionDialogProps) {
  const isEdit = !!question;
  const createMut = useCreateQuestion();
  const updateMut = useUpdateQuestion();

  const [text, setText] = useState("");
  const [type, setType] = useState<QuestionType>(QuestionType.single);
  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setText(question?.text ?? "");
    setType(question?.type ?? QuestionType.single);
    setOptions(
      question
        ? question.options.map((o: QuestionOptionView) => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
          }))
        : [
            { id: null, text: "", isCorrect: true },
            { id: null, text: "", isCorrect: false },
          ],
    );
    setTouched(false);
  }, [open, question]);

  const textError = touched && text.trim().length === 0;
  const optionsError =
    touched && options.some((o) => o.text.trim().length === 0);
  const correctError = touched && !options.some((o) => o.isCorrect);
  const canSubmit =
    text.trim().length > 0 &&
    options.length >= 2 &&
    options.every((o) => o.text.trim().length > 0) &&
    options.some((o) => o.isCorrect);
  const pending = createMut.isPending || updateMut.isPending;

  function addOption() {
    setOptions((prev) => [...prev, { id: null, text: "", isCorrect: false }]);
  }

  function removeOption(index: number) {
    setOptions((prev) => {
      if (prev.length <= 2) return prev;
      const next = prev.filter((_, i) => i !== index);
      // If we removed the only correct option in single mode, mark the first
      // remaining option correct so the question always has a correct answer.
      if (type === QuestionType.single && !next.some((o) => o.isCorrect)) {
        next[0] = { ...next[0], isCorrect: true };
      }
      return next;
    });
  }

  function setOptionText(index: number, value: string) {
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, text: value } : o)),
    );
  }

  function setCorrectSingle(index: number) {
    setOptions((prev) =>
      prev.map((o, i) => ({ ...o, isCorrect: i === index })),
    );
  }

  function toggleCorrectMultiple(index: number) {
    setOptions((prev) =>
      prev.map((o, i) => (i === index ? { ...o, isCorrect: !o.isCorrect } : o)),
    );
  }

  function onTypeChange(next: QuestionType) {
    setType(next);
    // Switching to single: keep only the first correct option correct.
    if (next === QuestionType.single) {
      setOptions((prev) => {
        const firstCorrect = prev.findIndex((o) => o.isCorrect);
        const target = firstCorrect === -1 ? 0 : firstCorrect;
        return prev.map((o, i) => ({ ...o, isCorrect: i === target }));
      });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    try {
      if (isEdit && question) {
        const edit: QuestionEdit = {
          text: text.trim(),
          questionType: type,
          options: options.map((o) => ({
            text: o.text.trim(),
            correct: o.isCorrect,
          })),
        };
        await updateMut.mutateAsync({
          quizId,
          questionId: question.id,
          edit,
        });
        toast.success("Question updated");
      } else {
        const input: QuestionInput = {
          text: text.trim(),
          questionType: type,
          options: options.map((o) => ({
            text: o.text.trim(),
            correct: o.isCorrect,
          })),
        };
        await createMut.mutateAsync({ quizId, input });
        toast.success("Question added");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(
        isEdit ? "Could not update question" : "Could not add question",
      );
      // eslint-disable-next-line no-console
      console.error(err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        data-ocid="quiz_edit.question.dialog"
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit question" : "New question"}</DialogTitle>
          <DialogDescription>
            Enter the question text, choose single or multiple answers, then
            fill in the options and mark the correct one(s).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          {/* Question text */}
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="question-text"
              data-ocid="quiz_edit.question.text.label"
            >
              Question
            </Label>
            <Textarea
              id="question-text"
              value={text}
              rows={3}
              autoFocus
              placeholder="e.g. What temperature should the milk be steamed to?"
              aria-invalid={textError}
              onChange={(e) => setText(e.target.value)}
              onBlur={() => setTouched(true)}
              data-ocid="quiz_edit.question.text.input"
            />
            {textError && (
              <p
                className="text-xs text-destructive"
                data-ocid="quiz_edit.question.text.field_error"
              >
                Question text is required.
              </p>
            )}
          </div>

          {/* Type toggle */}
          <div className="flex flex-col gap-2">
            <Label data-ocid="quiz_edit.question.type.label">Answer type</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => onTypeChange(v as QuestionType)}
              className="grid grid-cols-2 gap-3"
              data-ocid="quiz_edit.question.type.toggle"
            >
              <label
                htmlFor="type-single"
                className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border bg-background px-3 py-2.5 text-sm transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                data-ocid="quiz_edit.question.type.single"
              >
                <RadioGroupItem value="single" id="type-single" />
                <span className="font-medium">Single answer</span>
              </label>
              <label
                htmlFor="type-multiple"
                className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border bg-background px-3 py-2.5 text-sm transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                data-ocid="quiz_edit.question.type.multiple"
              >
                <RadioGroupItem value="multiple" id="type-multiple" />
                <span className="font-medium">Multiple answers</span>
              </label>
            </RadioGroup>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label data-ocid="quiz_edit.question.options.label">
                Answer options
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addOption}
                data-ocid="quiz_edit.question.add_option_button"
              >
                <Plus className="size-4" /> Add option
              </Button>
            </div>

            <ul className="flex flex-col gap-2">
              {options.map((opt, index) => (
                <li
                  key={opt.id ?? `opt-${index}`}
                  className="flex items-center gap-2.5"
                  data-ocid={`quiz_edit.question.option_input.${index + 1}`}
                >
                  {type === "single" ? (
                    <RadioGroup
                      value={
                        options.findIndex((o) => o.isCorrect) === index
                          ? String(index)
                          : ""
                      }
                      onValueChange={() => setCorrectSingle(index)}
                      className="grid"
                    >
                      <RadioGroupItem
                        value={String(index)}
                        id={`opt-${index}`}
                        aria-label={`Mark option ${index + 1} as correct`}
                        data-ocid={`quiz_edit.question.correct_radio.${index + 1}`}
                      />
                    </RadioGroup>
                  ) : (
                    <Checkbox
                      checked={opt.isCorrect}
                      onCheckedChange={() => toggleCorrectMultiple(index)}
                      aria-label={`Mark option ${index + 1} as correct`}
                      data-ocid={`quiz_edit.question.correct_checkbox.${index + 1}`}
                    />
                  )}
                  <Input
                    value={opt.text}
                    placeholder={`Option ${index + 1}`}
                    aria-invalid={touched && opt.text.trim().length === 0}
                    onChange={(e) => setOptionText(index, e.target.value)}
                    data-ocid={`quiz_edit.question.option_text.${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={options.length <= 2}
                    onClick={() => removeOption(index)}
                    aria-label="Remove option"
                    data-ocid={`quiz_edit.question.remove_option.${index + 1}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>

            {optionsError && (
              <p
                className="text-xs text-destructive"
                data-ocid="quiz_edit.question.options.field_error"
              >
                Every option needs text.
              </p>
            )}
            {correctError && !optionsError && (
              <p
                className="text-xs text-destructive"
                data-ocid="quiz_edit.question.correct.field_error"
              >
                Mark at least one option as correct.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {type === "single"
                ? "Select one radio to mark the single correct answer."
                : "Tick every checkbox that should be counted as correct."}
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              data-ocid="quiz_edit.question.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !canSubmit}
              data-ocid="quiz_edit.question.save_button"
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add question"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
