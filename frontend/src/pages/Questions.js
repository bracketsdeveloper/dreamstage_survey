// src/pages/Questions.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import SummaryApi from "../common";
import { useToast } from "../components/ToastProvider";
import AddQuestionModal from "../components/questions/AddQuestionModal";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const toast = useToast();

  const fetchQuestions = async () => {
    try {
      const res = await axios({
        method: SummaryApi.GetQuestions.method,
        url: SummaryApi.GetQuestions.url,
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setQuestions(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      toast.error("Failed to load questions");
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const openAdd = () => {
    setEditData(null);
    setModalOpen(true);
  };

  const openEdit = (q) => {
    setEditData(q);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditData(null);
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;

    // Prevent any item from being dropped into first position
    if (destination.index === 0) {
      toast.error("Position #1 is fixed and cannot be replaced");
      return;
    }

    const reordered = Array.from(questions);
    const [removed] = reordered.splice(source.index, 1);
    reordered.splice(destination.index, 0, removed);
    setQuestions(reordered);

    try {
      await axios({
        method: SummaryApi.ReorderQuestions.method,
        url: SummaryApi.ReorderQuestions.url,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        data: { ids: reordered.map((q) => q._id) },
      });
      toast.success("Order saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Order save failed");
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-semibold">Manage Questions</h1>
        <button
          onClick={openAdd}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          + Add Question
        </button>
      </div>

      <div className="mt-6 rounded border">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="list">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="divide-y"
              >
                {questions.map((q, idx) => (
                  <Draggable
                    key={q._id}
                    draggableId={q._id}
                    index={idx}
                    isDragDisabled={idx === 0} // first question cannot be dragged
                  >
                    {(prov) => (
                      <li
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...(idx === 0 ? {} : prov.dragHandleProps)}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <span className="font-medium">
                          {idx + 1}. {q.question}
                        </span>
                        {idx > 0 && (
                          <button
                            onClick={() => openEdit(q)}
                            className="rounded bg-gray-200 px-2 py-1 text-xs"
                          >
                            Edit
                          </button>
                        )}
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <AddQuestionModal
        open={modalOpen}
        onClose={closeModal}
        refresh={fetchQuestions}
        editData={editData}
      />
    </div>
  );
};

export default Questions;
