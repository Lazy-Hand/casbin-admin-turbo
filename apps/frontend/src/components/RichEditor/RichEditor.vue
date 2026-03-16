<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { useThemeVars, NButton, NTooltip, NInput, NModal, NIcon } from 'naive-ui'
import { watch, onBeforeUnmount, ref } from 'vue'
import {
  UnderlineOutlined,
  StrikethroughOutlined,
  BoldOutlined,
  RedoOutlined,
  UndoOutlined,
  DeleteOutlined,
  ItalicOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  LinkOutlined,
  PictureOutlined,
  CodeOutlined,
  DisconnectOutlined,
} from '@vicons/antd'
interface Props {
  modelValue?: string
  placeholder?: string
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入内容...',
  editable: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const themeVars = useThemeVars()

const linkUrl = ref('')
const showLinkModal = ref(false)
const pendingLinkRange = ref<{ from: number; to: number } | null>(null)

const editor = useEditor({
  content: props.modelValue,
  editable: props.editable,
  extensions: [
    StarterKit,
    TiptapImage.configure({
      inline: true,
      allowBase64: true,
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (editor.value && newValue !== editor.value.getHTML()) {
      editor.value.commands.setContent(newValue, { emitUpdate: false })
    }
  },
)

watch(
  () => props.editable,
  (newValue) => {
    editor.value?.setEditable(newValue)
  },
)

const isActive = (name: string, attributes?: Record<string, unknown>) => {
  return editor.value?.isActive(name, attributes) ?? false
}

const toggleBold = () => editor.value?.chain().focus().toggleBold().run()
const toggleItalic = () => editor.value?.chain().focus().toggleItalic().run()
const toggleUnderline = () => editor.value?.chain().focus().toggleUnderline().run()
const toggleStrike = () => editor.value?.chain().focus().toggleStrike().run()
const toggleHeading = (level: 1 | 2 | 3) =>
  editor.value?.chain().focus().toggleHeading({ level }).run()
const toggleBulletList = () => editor.value?.chain().focus().toggleBulletList().run()
const toggleOrderedList = () => editor.value?.chain().focus().toggleOrderedList().run()
const toggleCodeBlock = () => editor.value?.chain().focus().toggleCodeBlock().run()
const setLink = () => {
  if (!editor.value) return
  const previousUrl = editor.value.getAttributes('link').href
  linkUrl.value = previousUrl || ''
  const { from, to } = editor.value.state.selection
  pendingLinkRange.value = { from, to }
  showLinkModal.value = true
}

const confirmLink = () => {
  if (!editor.value || !pendingLinkRange.value) return
  if (linkUrl.value) {
    editor.value.chain().focus().setLink({ href: linkUrl.value }).run()
  } else {
    editor.value.chain().focus().unsetLink().run()
  }
  showLinkModal.value = false
  linkUrl.value = ''
  pendingLinkRange.value = null
}

const removeLink = () => {
  editor.value?.chain().focus().unsetLink().run()
}

const insertImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = () => {
    const file = input.files?.[0]
    if (file && editor.value) {
      const currentEditor = editor.value
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        currentEditor.chain().focus().setImage({ src: result }).run()
      }
      reader.readAsDataURL(file)
    }
  }
  input.click()
}

const clearFormat = () => {
  editor.value?.chain().focus().clearNodes().unsetAllMarks().run()
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})

defineExpose({ editor })
</script>

<template>
  <div class="rich-editor" :style="{ '--n-primary-color': themeVars.primaryColor }">
    <!-- Toolbar -->
    <div v-if="editor" class="editor-toolbar">
      <div class="toolbar-group">
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton
              quaternary
              size="small"
              :type="isActive('bold') ? 'primary' : 'default'"
              @click="toggleBold"
            >
              <NIcon :component="UndoOutlined" />
            </NButton>
          </template>
          撤销
        </NTooltip>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton
              quaternary
              size="small"
              :type="isActive('bold') ? 'primary' : 'default'"
              @click="toggleBold"
            >
              <NIcon :component="RedoOutlined" />
            </NButton>
          </template>
          重做
        </NTooltip>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton quaternary size="small" @click="clearFormat">
              <NIcon :component="DeleteOutlined" />
            </NButton>
          </template>
          清除格式
        </NTooltip>
      </div>
      <div class="toolbar-divider" />
      <div class="toolbar-group">
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton
              quaternary
              size="small"
              :type="isActive('heading', { level: 1 }) ? 'primary' : 'default'"
              @click="toggleHeading(1)"
            >
              H1
            </NButton>
          </template>
          标题1
        </NTooltip>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton
              quaternary
              size="small"
              :type="isActive('heading', { level: 2 }) ? 'primary' : 'default'"
              @click="toggleHeading(2)"
            >
              H2
            </NButton>
          </template>
          标题2
        </NTooltip>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton
              quaternary
              size="small"
              :type="isActive('heading', { level: 3 }) ? 'primary' : 'default'"
              @click="toggleHeading(3)"
            >
              H3
            </NButton>
          </template>
          标题3
        </NTooltip>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton
              quaternary
              size="small"
              :type="isActive('bold') ? 'primary' : 'default'"
              @click="toggleBold"
            >
              <NIcon :component="BoldOutlined" />
            </NButton>
          </template>
          加粗
        </NTooltip>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton
              quaternary
              size="small"
              :type="isActive('italic') ? 'primary' : 'default'"
              @click="toggleItalic"
            >
              <NIcon :component="ItalicOutlined" />
            </NButton>
          </template>
          斜体
        </NTooltip>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton
              quaternary
              size="small"
              :type="isActive('underline') ? 'primary' : 'default'"
              @click="toggleUnderline"
            >
              <NIcon :component="UnderlineOutlined" />
            </NButton>
          </template>
          下划线
        </NTooltip>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton
              quaternary
              size="small"
              :type="isActive('strike') ? 'primary' : 'default'"
              @click="toggleStrike"
            >
              <NIcon :component="StrikethroughOutlined" />
            </NButton>
          </template>
          删除线
        </NTooltip>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton
              quaternary
              size="small"
              :type="isActive('bulletList') ? 'primary' : 'default'"
              @click="toggleBulletList"
            >
              <NIcon :component="UnorderedListOutlined" />
            </NButton>
          </template>
          无序列表
        </NTooltip>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton
              quaternary
              size="small"
              :type="isActive('orderedList') ? 'primary' : 'default'"
              @click="toggleOrderedList"
            >
              <NIcon :component="OrderedListOutlined" />
            </NButton>
          </template>
          有序列表
        </NTooltip>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton
              quaternary
              size="small"
              :type="isActive('codeBlock') ? 'primary' : 'default'"
              @click="toggleCodeBlock"
            >
              <NIcon :component="CodeOutlined" />
            </NButton>
          </template>
          代码块
        </NTooltip>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton quaternary size="small" @click="setLink">
              <NIcon :component="LinkOutlined" />
            </NButton>
          </template>
          链接
        </NTooltip>
        <NTooltip v-if="isActive('link')" trigger="hover">
          <template #trigger>
            <NButton quaternary size="small" @click="removeLink">
              <NIcon :component="DisconnectOutlined" />
            </NButton>
          </template>
          取消链接
        </NTooltip>
        <NTooltip trigger="hover">
          <template #trigger>
            <NButton quaternary size="small" @click="insertImage">
              <NIcon :component="PictureOutlined" />
            </NButton>
          </template>
          图片
        </NTooltip>
      </div>

      <div class="toolbar-divider" />
    </div>

    <!-- Editor Content -->
    <EditorContent :editor="editor" class="editor-content" />

    <!-- Link Modal -->
    <NModal
      class="w-full md:w-150!"
      v-model:show="showLinkModal"
      preset="card"
      title="插入链接"
      @positive-click="confirmLink"
    >
      <NInput v-model:value="linkUrl" placeholder="请输入链接地址" />
      <template #footer>
        <div class="flex justify-end gap-2">
          <NButton @click="showLinkModal = false">取消</NButton>
          <NButton type="primary" @click="confirmLink">确定</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.rich-editor {
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 8px 12px;
  background: var(--n-color);
  border-bottom: 1px solid var(--n-border-color);
  gap: 4px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--n-border-color);
  margin: 0 6px;
}

.editor-content {
  min-height: 200px;
  padding: 12px;
  background: var(--n-color);
}

.editor-content :deep(.ProseMirror) {
  outline: none;
  min-height: 180px;
}

.editor-content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--n-text-color-3);
  pointer-events: none;
  height: 0;
}

.editor-content :deep(.ProseMirror h1) {
  font-size: 1.75em;
  font-weight: 600;
  margin: 0.5em 0;
}

.editor-content :deep(.ProseMirror h2) {
  font-size: 1.5em;
  font-weight: 600;
  margin: 0.5em 0;
}

.editor-content :deep(.ProseMirror h3) {
  font-size: 1.25em;
  font-weight: 600;
  margin: 0.5em 0;
}

.editor-content :deep(.ProseMirror ul),
.editor-content :deep(.ProseMirror ol) {
  padding-left: 1.5em;
  margin: 0.5em 0;
}

.editor-content :deep(.ProseMirror li) {
  margin: 0.25em 0;
}

.editor-content :deep(.ProseMirror pre) {
  background: var(--n-color-hover);
  border-radius: 4px;
  padding: 12px;
  margin: 0.5em 0;
  overflow-x: auto;
}

.editor-content :deep(.ProseMirror code) {
  background: var(--n-color-hover);
  border-radius: 3px;
  padding: 2px 4px;
  font-family: 'Fira Code', monospace;
  font-size: 0.9em;
}

.editor-content :deep(.ProseMirror pre code) {
  background: none;
  padding: 0;
}

.editor-content :deep(.ProseMirror blockquote) {
  border-left: 3px solid var(--n-primary-color);
  padding-left: 1em;
  margin: 0.5em 0;
  color: var(--n-text-color-3);
}

.editor-content :deep(.ProseMirror img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 0.5em 0;
}

.editor-content :deep(.editor-link) {
  color: var(--n-primary-color);
  text-decoration: underline;
  cursor: pointer;
}
</style>
