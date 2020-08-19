/* @flow */

import React from 'react';
import { Image, Platform, Text, TextInput, View , TouchableOpacity} from 'react-native';
import { Cell, Grid, Row } from 'react-native-tabular-grid-markdown-view';
import { connect } from 'react-redux';
import { hideDotsMenu } from '../../src/actions/ticket';
import type { EmptyNode, HeadingNode, ImageNode, InlineContentNode, LinkNode, ListNode, OutputFunction, RenderState, RenderStyles, TableNode } from './types';

const CustomTextField = (props) => {

  if (Platform.OS == 'android') {
    return <Text {...props} selectable={true} />
  }
  return (
    <TextInput
      {...props}
      multiline={true}
      editable={false}
      scrollEnabled={false}
      onTouchStart={()=>{
        props && props.hideDotsMenu && props.hideDotsMenu()
      }}
    />
  )
}
const mapDispatchToProps = dispatch => ({
  hideDotsMenu: () => dispatch(hideDotsMenu())
});
const TextField = connect(null, mapDispatchToProps)(CustomTextField);

function renderImage(node: ImageNode, output: OutputFunction, state: RenderState, styles: RenderStyles) {
  const { imageWrapper: wrapperStyle, image: imageStyle } = styles
  return (
    <View key={state.key} style={node.width && node.height ? [wrapperStyle, paddedSize(node, wrapperStyle)] : wrapperStyle}>
      <Image source={{ uri: node.target }} style={imageStyle} />
    </View>
  )
}

function renderTableCell(cell, row, column, rowCount, columnCount, output, state, styles) {
  const cellStyle = [styles.tableCell]
  const contentStyle = [styles.tableCellContent]

  if (row % 2 == 0) {
    cellStyle.push(styles.tableCellEvenRow)
    contentStyle.push(styles.tableCellContentEvenRow)
  } else {
    cellStyle.push(styles.tableCellOddRow)
    contentStyle.push(styles.tableCellContentOddRow)
  }

  if (column % 2 == 0) {
    cellStyle.push(styles.tableCellEvenColumn)
    contentStyle.push(styles.tableCellContentEvenColumn)
  } else {
    cellStyle.push(styles.tableCellOddColumn)
    contentStyle.push(styles.tableCellContentOddColumn)
  }

  if (row == 1) {
    cellStyle.push(styles.tableHeaderCell)
    contentStyle.push(styles.tableHeaderCellContent)
  } else if (row == rowCount) {
    cellStyle.push(styles.tableCellLastRow)
    contentStyle.push(styles.tableCellContentLastRow)
  }

  if (column == columnCount) {
    cellStyle.push(styles.tableCellLastColumn)
    contentStyle.push(styles.tableCellContentLastColumn)
  }

  return <Cell rowId={row} id={column} key={column} style={cellStyle}>
    <TextField style={contentStyle}>
      {output(cell, state)}
    </TextField>
  </Cell>
}

function paragraphRenderer() {
  var renderText = textContentRenderer('paragraph')

  return (node: InlineContentNode, output: OutputFunction, state: RenderState, styles: RenderStyles) => {
    if (node.content instanceof Array && node.content.length === 1 && node.content[0].type === 'image') {
      const imageNode: ImageNode = node.content[0]
      return renderImage(imageNode, output, state, styles)
    } else {
      return renderText(node, output, state, styles)
    }
  }
}

function textContentRenderer(styleName, styleName2) {
  return (node: InlineContentNode, output: OutputFunction, state: RenderState, styles: RenderStyles) => (
    <TextField key={state.key} style={styleName2 ? [styles[styleName], styles[styleName2]] : styles[styleName]}>
      {typeof node.content === 'string' ? node.content : output(node.content, state)}
    </TextField>
  )
}

function paddedSize(size, style) {
  function either(a, b) {
    return a === undefined ? b : a
  }

  const {
    padding = 0,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
  } = style

  return {
    width: size.width + either(paddingLeft, padding) + either(paddingRight, padding),
    height: size.height + either(paddingTop, padding) + either(paddingBottom, padding)
  }
}

export default Object.freeze({
  blockQuote: textContentRenderer('blockQuote'),
  br: (node: EmptyNode, output: OutputFunction, state: RenderState, styles: RenderStyles) => (
    <TextField key={state.key} style={styles.br}>
      {'\n\n'}
    </TextField>
  ),
  codeBlock: textContentRenderer('codeBlock'),
  del: textContentRenderer('del'),
  em: textContentRenderer('em'),
  heading: (node: HeadingNode, output: OutputFunction, state: RenderState, styles: RenderStyles) => (
    textContentRenderer('heading', 'heading' + node.level)(node, output, state, styles)
  ),
  hr: (node: EmptyNode, output: OutputFunction, state: RenderState, styles: RenderStyles) => (
    <View key={state.key} style={styles.hr} />
  ),
  image: renderImage,
  inlineCode: textContentRenderer('inlineCode'),
  link: (node: LinkNode, output: OutputFunction, state: RenderState, styles: RenderStyles) => {
    const onPress = state.onLinkPress
    return <TextField key={state.key} style={styles.link} onPress={onPress ? () => onPress(node.target) : null}>
      {typeof node.content === 'string' ? node.content : output(node.content, state)}
    </TextField>
  },
  list: (node: ListNode, output: OutputFunction, state: RenderState, styles: RenderStyles) => (
    <View key={state.key} style={styles.list}>
      {node.items.map((item, i) => (
        <View key={i} style={styles.listItem}>
          {
            node.ordered ?
              <TextField style={styles.listItemNumber}>{`${i + 1}.`}</TextField>
              :
              <TextField style={styles.listItemBullet}>
                {styles.listItemBullet && styles.listItemBullet.content ? styles.listItemBullet.content : '\u2022'}
              </TextField>
          }
          <TextField style={node.ordered ? styles.listItemOrderedContent : styles.listItemUnorderedContent}>
            {output(item, state)}
          </TextField>
        </View>
      ))}
    </View>
  ),
  newline: (node: EmptyNode, output: OutputFunction, state: RenderState, styles: RenderStyles) => (
    <TextField key={state.key} style={styles.newline}>
      {'\n'}
    </TextField>
  ),
  paragraph: paragraphRenderer(),
  strong: textContentRenderer('strong'),
  table: (node: TableNode, output: OutputFunction, state: RenderState, styles: RenderStyles) => (
    <Grid key={state.key} style={styles.table}>
      {[<Row id={1} key={1}>
        {node.header.map((cell, column) => renderTableCell(cell, 1, column + 1, node.cells.length + 1, node.header.length, output, state, styles))}
      </Row>].concat(node.cells.map((cells, row) => (
        <Row id={row + 2} key={row + 2}>
          {cells.map((cell, column) => renderTableCell(cell, row + 2, column + 1, node.cells.length + 1, cells.length, output, state, styles))}
        </Row>
      )))}
    </Grid>
  ),
  text: textContentRenderer('text'),
  u: textContentRenderer('u')
})
