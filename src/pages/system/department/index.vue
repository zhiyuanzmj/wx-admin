<script setup lang="tsx" name="system-department">
import { AgGridVue } from 'ag-grid-vue3'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Department } from './api'
import { drop, getDepartment, getDepartmentList, put } from './api'
import VForm from './components/VForm.vue'
import DepartmentTree from './components/DepartmentTree.vue'

let show = $ref(false)
let treeKey = $ref(0)
let departmentId = $(useRouteQuery<string>('departmentId'))
let department = $ref<Department>()

const { agGridBind, agGridOn, selectedList, getList, row, list } = useAgGrid<Department>(
  () => [
    { headerName: '', field: 'select', maxWidth: 68, rowDrag: true, lockPosition: 'left', pinned: 'left', valueGetter: '', unCheck: true, suppressMovable: true, checkboxSelection: true, headerCheckboxSelection: true },
    { headerName: '名称', field: 'name', value: '', cellRenderer: { setup: ({ params }) => () =>
      <span
        onClick={() => (departmentId = params.data[!params.rowIndex && departmentId ? 'parentId' : 'id']!)}
        className={`flex-inline items-center cursor-pointer gap-1.5 hover:text-primary ${departmentId && params.rowIndex ? 'ml-11' : ''}`}
      >
        {!params.rowIndex && departmentId
          ? <i className={`text-gray-400 bx-bxs-down-arrow ${params.data?.hasChildren ? '' : 'hidden'}`} />
          : params.data.hasChildren ? <i className={`text-gray-400 bx-bxs-right-arrow ${departmentId ? '-ml-6' : ''}`} /> : null}
        <span>{params.data?.name}</span>
      </span>,
    } },
    { headerName: '描述', field: 'remark', value: '' },
    { headerName: '操作', field: 'actions', unCheck: true, minWidth: 70, maxWidth: 70, suppressMovable: true, lockPosition: 'right', pinned: 'right', cellRenderer: { setup: props => () =>
      <div className="flex items-center justify-between">
        <button v-permission="/sys/department/edit" className="fa6-solid:pen-to-square btn" onClick={() => {
          show = true
          row.value = props.params.data
        }}/>
        <button v-permission="/sys/department/delete" className="fa6-solid:trash-can btn" onClick={() => onDrop([props.params.data])}/>
      </div>,
    } },
  ],
  async (params) => {
    department = departmentId ? await getDepartment(departmentId).then(({ data }) => data) : { hasChildren: true }
    if (department.hasChildren) {
      const { data, total } = await getDepartmentList({ ...params, parentId: departmentId })
      return { data: departmentId ? [department, ...data] : data, total }
    }
    return { data: [department], total: 0 }
  },
)

async function onDrop(list: any[]) {
  await ElMessageBox.confirm(`确定删除 ${list.length} 条数据？`, '提示')
  const [fulfilled, rejected] = (await Promise.allSettled(list.map(i => drop(i.id))))
    .reduce((a, b) => (a[b.status === 'fulfilled' ? 0 : 1]++, a), [0, 0])
  fulfilled && ElMessage.success(`删除成功 ${fulfilled} 条`); await nextTick()
  rejected && ElMessage.error(`删除失败 ${rejected} 条`)
  getList()
}

function addHandler() {
  show = true
  row.value = {}
}

function rowDragEnd({ node, overIndex }: any) {
  Promise.all([
    put({ id: node.data.id, sort: list.value[overIndex].sort }),
    put({ id: list.value[overIndex].id, sort: node.data.sort }),
  ]).then(() => { getList(); treeKey++ })
}

watch(() => departmentId, () => {
  getList()
})
</script>

<template>
  <div layout>
    <VHeader>
      <el-button v-permission="'/sys/department/add'" class="!ml-auto" type="primary" @click="addHandler">
        <div fluent:add-12-filled mr-1 />新增
      </el-button>
    </VHeader>

    <div flex="~ 1" gap-3 m-3>
      <DepartmentTree v-if="department" :key="treeKey" v-model:departmentId="departmentId" :department="department" />

      <div main m-0>
        <VFilter />
        <ag-grid-vue v-bind="{ ...agGridBind, getRowId: undefined }" v-on="{ ...agGridOn, rowDragEnd }" />
        <Pagination>
          <el-button v-permission="'/sys/department/delete'" type="primary" :disabled="!selectedList.length" text @click="onDrop(selectedList)">
            删除
          </el-button>
        </Pagination>
      </div>
    </div>

    <VForm
      v-if="show"
      :id="row.id"
      v-model:show="show"
      v-model:treeKey="treeKey"
      :parent-id="departmentId"
    />
  </div>
</template>

<route lang="yaml">
meta:
  title: 部门管理
  permission:
    - title: 列表
      permission: /sys/department/list
    - title: 添加
      permission: /sys/department/add
    - title: 修改
      permission: /sys/department/edit
    - title: 删除
      permission: /sys/department/delete
</route>
