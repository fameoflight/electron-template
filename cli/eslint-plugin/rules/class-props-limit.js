/**
 * Class Props Limit Rule
 *
 * Enforces maximum number of properties in classes (constructor params + instance fields).
 * Excludes static properties since they're class-level configuration, not instance state.
 * Following the "maximum 5 parameters" principle for better design.
 */

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce maximum number of properties in classes',
      category: 'Best Practices',
      recommended: true
    },
    fixable: undefined,
    schema: [{
      type: 'object',
      properties: {
        max: {
          type: 'number',
          minimum: 1,
          default: 5
        }
      }
    }],
    messages: {
      tooManyProps: 'Class has {{count}} properties, which exceeds the maximum of {{max}}.'
    }
  },

  create(context) {
    const options = context.options[0] || {};
    const maxProps = options.max || 5;

    return {
      ClassDeclaration(node) {
        let propCount = 0;

        // Count constructor parameters
        const constructor = node.body.body.find(member =>
          member.type === 'MethodDefinition' && member.kind === 'constructor'
        );

        if (constructor && constructor.value.params) {
          propCount += constructor.value.params.length;
        }

        // Count class properties (exclude static properties)
        const properties = node.body.body.filter(member =>
          member.type === 'PropertyDefinition' && !member.static
        );

        propCount += properties.length;

        if (propCount > maxProps) {
          context.report({
            node: node.id || node,
            messageId: 'tooManyProps',
            data: { count: propCount, max: maxProps }
          });
        }
      }
    };
  }
};